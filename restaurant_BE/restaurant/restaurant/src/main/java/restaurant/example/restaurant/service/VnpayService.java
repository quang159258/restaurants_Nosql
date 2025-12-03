package restaurant.example.restaurant.service;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.SortedMap;
import java.util.TreeMap;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import restaurant.example.restaurant.config.VnpayProperties;
import restaurant.example.restaurant.redis.model.Order;

@Service
public class VnpayService {

    private final VnpayProperties properties;
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public VnpayService(VnpayProperties properties) {
        this.properties = properties;
    }

    public boolean isConfigured() {
        return properties.getTmnCode() != null && !properties.getTmnCode().isBlank()
                && properties.getHashSecret() != null && !properties.getHashSecret().isBlank();
    }

    public PaymentUrlResponse createPayment(Order order, String clientIp) {
        if (!isConfigured()) {
            throw new IllegalStateException("VNPay is not configured");
        }
        String txnRef = generateTxnRef(order.getId());
        SortedMap<String, String> params = new TreeMap<>();
        params.put("vnp_Version", properties.getVersion());
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", properties.getTmnCode());
        params.put("vnp_Amount", String.valueOf(Math.round(order.getTotalPrice() * 100)));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", txnRef);
        // Lưu giá trị gốc (không URL encode) để tính hash
        // Loại bỏ ký tự đặc biệt có thể gây lỗi
        String orderInfo = "Thanh toan don hang " + order.getId();
        params.put("vnp_OrderInfo", orderInfo);
        params.put("vnp_OrderType", properties.getOrderType());
        params.put("vnp_Locale", properties.getLocale());
        params.put("vnp_ReturnUrl", properties.getReturnUrl());
        // Normalize IPv6 localhost về IPv4 localhost (VNPAY yêu cầu IPv4)
        String normalizedIp = normalizeIpAddress(clientIp);
        params.put("vnp_IpAddr", normalizedIp);
        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        params.put("vnp_CreateDate", formatter.format(now));
        params.put("vnp_ExpireDate", formatter.format(now.plusMinutes(15)));

        // Build hash data từ giá trị gốc (không URL encode, không có vnp_SecureHash)
        String hashData = buildHashData(params);
        System.out.println("=== VNPAY DEBUG ===");
        System.out.println("Hash Secret: " + properties.getHashSecret());
        System.out.println("Hash Secret Length: " + (properties.getHashSecret() != null ? properties.getHashSecret().length() : 0));
        System.out.println("Hash Data: " + hashData);
        System.out.println("Hash Data Length: " + hashData.length());
        System.out.println("Params for hash:");
        for (Map.Entry<String, String> entry : params.entrySet()) {
            System.out.println("  " + entry.getKey() + " = [" + entry.getValue() + "]");
        }
        // Tính secure hash
        String secureHash = hmacSHA512(properties.getHashSecret(), hashData);
        System.out.println("Calculated Secure Hash: " + secureHash);
        System.out.println("Secure Hash Length: " + secureHash.length());
        System.out.println("===================");
        
        // Build query string với tất cả params đã được URL encode
        String query = buildQuery(params);
        System.out.println("VNPAY Query String: " + query); // Debug log
        // Append secure hash vào query string (không URL encode hash)
        String paymentUrl = properties.getBaseUrl() + "?" + query + "&vnp_SecureHash=" + secureHash;
        System.out.println("VNPAY Payment URL: " + paymentUrl); // Debug log

        return new PaymentUrlResponse(paymentUrl, txnRef);
    }

    public ValidationResult validateRequest(Map<String, String> requestParams) {
        String receivedHash = requestParams.getOrDefault("vnp_SecureHash", "");
        SortedMap<String, String> params = new TreeMap<>();
        for (Map.Entry<String, String> entry : requestParams.entrySet()) {
            String key = entry.getKey();
            if (key.startsWith("vnp_") && !"vnp_SecureHash".equalsIgnoreCase(key)
                    && !"vnp_SecureHashType".equalsIgnoreCase(key)) {
                params.put(key, entry.getValue());
            }
        }
        String expectedHash = hmacSHA512(properties.getHashSecret(), buildHashData(params));
        boolean valid = expectedHash.equalsIgnoreCase(receivedHash);
        return new ValidationResult(valid, params);
    }

    public String buildFrontendRedirect(boolean success, String message, Order order) {
        StringBuilder builder = new StringBuilder();
        builder.append(frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl);
        // Redirect về payment result page
        builder.append("/payment-result?status=").append(success ? "success" : "failed");
        if (order != null) {
            builder.append("&orderId=").append(order.getId());
            builder.append("&amount=").append(Math.round(order.getTotalPrice()));
        }
        if (message != null && !message.isBlank()) {
            builder.append("&message=").append(urlEncode(message));
        }
        return builder.toString();
    }

    private String generateTxnRef(String orderId) {
        return orderId + "-" + System.currentTimeMillis();
    }

    /**
     * Normalize IP address: convert IPv6 localhost to IPv4 localhost
     * VNPAY requires IPv4 address format
     */
    private String normalizeIpAddress(String ip) {
        if (ip == null || ip.isEmpty()) {
            return "127.0.0.1";
        }
        // Normalize IPv6 localhost variants to IPv4
        if (ip.equals("::1") || ip.equals("0:0:0:0:0:0:0:1") || ip.startsWith("::ffff:")) {
            return "127.0.0.1";
        }
        // If it's already IPv4, return as is
        return ip;
    }

    private String buildQuery(SortedMap<String, String> params) {
        StringBuilder query = new StringBuilder();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            String value = entry.getValue();
            // Loại bỏ các params có giá trị null hoặc empty khi build query
            if (value == null || value.isEmpty()) {
                continue;
            }
            if (query.length() > 0) {
                query.append("&");
            }
            query.append(urlEncode(entry.getKey()))
                    .append("=")
                    .append(urlEncode(value));
        }
        return query.toString();
    }

    private String buildHashData(SortedMap<String, String> params) {
        StringBuilder data = new StringBuilder();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            // Loại bỏ các params có giá trị null hoặc empty khi tính hash
            // Loại bỏ vnp_SecureHash và vnp_SecureHashType
            if (value == null || value.isEmpty() 
                    || "vnp_SecureHash".equalsIgnoreCase(key)
                    || "vnp_SecureHashType".equalsIgnoreCase(key)) {
                continue;
            }
            if (data.length() > 0) {
                data.append("&");
            }
            // Hash data sử dụng giá trị gốc (KHÔNG URL encode)
            // Đảm bảo key và value được nối đúng format: key=value
            data.append(key).append("=").append(value);
        }
        return data.toString();
    }

    private String urlEncode(String value) {
        if (value == null) {
            return "";
        }
        try {
            // URL encode chuẩn (space sẽ thành +)
            // VNPAY yêu cầu encode theo chuẩn RFC 3986
            String encoded = URLEncoder.encode(value, "UTF-8");
            // Giữ nguyên các ký tự đặc biệt đã được encode đúng
            return encoded;
        } catch (UnsupportedEncodingException e) {
            return value;
        }
    }

    private String hmacSHA512(String key, String data) {
        try {
            Mac hmac = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes("UTF-8"), "HmacSHA512");
            hmac.init(secretKey);
            byte[] hashBytes = hmac.doFinal(data.getBytes("UTF-8"));
            // Convert bytes to hex string (uppercase) - VNPAY format
            StringBuilder sb = new StringBuilder();
            for (byte hashByte : hashBytes) {
                // Convert byte to unsigned int and format as 2-digit hex
                int unsignedByte = hashByte & 0xff;
                String hex = String.format("%02x", unsignedByte);
                sb.append(hex);
            }
            // Return uppercase hex string
            return sb.toString().toUpperCase();
        } catch (Exception e) {
            System.err.println("Error calculating HMAC-SHA512: " + e.getMessage());
            e.printStackTrace();
            throw new IllegalStateException("Cannot sign VNPay request", e);
        }
    }

    public static class PaymentUrlResponse {
        private final String paymentUrl;
        private final String txnRef;

        public PaymentUrlResponse(String paymentUrl, String txnRef) {
            this.paymentUrl = paymentUrl;
            this.txnRef = txnRef;
        }

        public String getPaymentUrl() {
            return paymentUrl;
        }

        public String getTxnRef() {
            return txnRef;
        }
    }

    public static class ValidationResult {
        private final boolean valid;
        private final SortedMap<String, String> params;

        public ValidationResult(boolean valid, SortedMap<String, String> params) {
            this.valid = valid;
            this.params = params;
        }

        public boolean isValid() {
            return valid;
        }

        public SortedMap<String, String> getParams() {
            return params;
        }
    }
}

