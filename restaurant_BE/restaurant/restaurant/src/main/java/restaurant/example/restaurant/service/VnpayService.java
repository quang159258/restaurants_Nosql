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
import restaurant.example.restaurant.domain.Order;

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
        params.put("vnp_OrderInfo", "Thanh toan don hang #" + order.getId());
        params.put("vnp_OrderType", properties.getOrderType());
        params.put("vnp_Locale", properties.getLocale());
        params.put("vnp_ReturnUrl", properties.getReturnUrl());
        params.put("vnp_IpAddr", clientIp != null ? clientIp : "127.0.0.1");
        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        params.put("vnp_CreateDate", formatter.format(now));
        params.put("vnp_ExpireDate", formatter.format(now.plusMinutes(15)));

        String query = buildQuery(params);
        String secureHash = hmacSHA512(properties.getHashSecret(), buildHashData(params));
        // URL encode the secure hash and properly append it to the query string
        String paymentUrl = properties.getBaseUrl() + "?" + query + "&vnp_SecureHash=" + urlEncode(secureHash);

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

    private String generateTxnRef(Long orderId) {
        return orderId + "-" + System.currentTimeMillis();
    }

    private String buildQuery(SortedMap<String, String> params) {
        StringBuilder query = new StringBuilder();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            query.append(urlEncode(entry.getKey()))
                    .append("=")
                    .append(urlEncode(entry.getValue()))
                    .append("&");
        }
        return query.toString();
    }

    private String buildHashData(SortedMap<String, String> params) {
        StringBuilder data = new StringBuilder();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            data.append(entry.getKey()).append("=").append(entry.getValue());
            data.append("&");
        }
        if (data.length() > 0) {
            data.deleteCharAt(data.length() - 1);
        }
        return data.toString();
    }

    private String urlEncode(String value) {
        try {
            return URLEncoder.encode(value, "UTF-8");
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
            StringBuilder sb = new StringBuilder();
            for (byte hashByte : hashBytes) {
                String hex = Integer.toHexString(0xff & hashByte);
                if (hex.length() == 1) {
                    sb.append('0');
                }
                sb.append(hex);
            }
            return sb.toString().toUpperCase();
        } catch (Exception e) {
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


