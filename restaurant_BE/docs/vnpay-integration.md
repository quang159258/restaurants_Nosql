# VNPay Integration Plan

## Goals
- Support both `CASH` and `VNPAY` payment methods when users checkout.
- Generate VNPay payment URLs server-side and redirect customers to VNPay when they choose online payment.
- Wait for VNPay IPN notifications to mark orders as paid automatically.
- Redirect customers back to the frontend with a clear success/failure message.
- Keep COD flow unchanged (staff/admin confirm payments manually).

## Backend Changes

1. **Configuration**
   - Added `vnpay` properties in `application.properties` (tmnCode, hashSecret, baseUrl, returnUrl, ipnUrl, locale, etc.).
   - Added `app.frontend-url` to build redirect links (default `http://localhost:5173`).
2. **Domain/Enums**
   - `PaymentMethod` now includes `VNPAY`.
   - Orders store `paymentRef` (VNPay transaction reference) for reconciliation.
3. **Services**
   - `VnpayService` builds signed payment URLs, validates signatures, and assembles frontend redirect URLs.
4. **Checkout Flow**
   - `/cart/checkout` accepts `paymentMethod`. If `VNPAY`, it:
     - Creates the order
     - Generates the VNPay URL
     - Stores the `paymentRef`
     - Returns `paymentUrl` to the client inside `CheckoutResponse`
5. **Callbacks**
   - `/api/v1/payment/vnpay/ipn`: validates signature, checks amount, and updates order status/payment status.
   - `/api/v1/payment/vnpay/return`: validates signature then redirects to `FE/payment-result` with status + message.
6. **Security**
   - No authentication required for VNPay IPN/return endpoints (they validate signatures).

## Frontend Changes

1. `/info` screens already support address editing + password change.
2. `/confirm` now lets customers choose `CASH` or `VNPay`.
3. `/payment` (SimplePayment) reuses the existing flow:
   - COD -> success toast + thanks page
   - VNPAY -> redirect to returned `paymentUrl`
4. `/payment-result` page reads query (`status`, `message`, `orderId`, `amount`) and displays the outcome.

## Environments & Secrets

| Key | Description |
| --- | ----------- |
| `Vnpay__TmnCode` | Merchant code issued by VNPay |
| `Vnpay__HashSecret` | Secret key for signing |
| `Vnpay__BaseUrl` | VNPay pay URL (sandbox by default) |
| `Vnpay__ReturnUrl` | Public HTTPS URL to `/api/v1/payment/vnpay/return` |
| `Vnpay__IpnUrl` | Public HTTPS URL to `/api/v1/payment/vnpay/ipn` |
| `Vnpay__Version`, `Vnpay__OrderType`, `Vnpay__Locale` | Optional overrides |
| `APP_FRONTEND_URL` | Frontend base (defaults to `http://localhost:5173`) |

## Test Checklist (Todo #4)

1. **COD Regression**
   - Checkout with `CASH`
   - Ensure response contains `orderId`, no `paymentUrl`
   - Staff/admin confirms payment via existing flow
2. **VNPay Happy Path**
   - Checkout with `VNPAY`
   - Backend responds with `paymentUrl` and keeps `paymentStatus = PAYMENT_UNPAID`
   - Browser redirects to VNPay, complete payment on sandbox
   - VNPay calls `/payment/vnpay/ipn` -> order becomes `PAID` & `CONFIRMED`
   - Return URL redirects to `/payment-result?status=success...`
3. **VNPay Failure**
   - Cancel payment on VNPay page
   - IPN returns failure, order stays `PAYMENT_UNPAID`
   - Frontend shows failure message and allows retry
4. **Signature Verification**
   - Tamper with query parameters before hitting `/payment-result`
   - Service detects invalid signature and treats as failure
5. **Configuration Validation**
   - Start backend without VNPay credentials -> `/cart/checkout` should reject VNPay method with a clear message.

## Detailed Payment Flow

1. **Customer chooses VNPay** on `/confirm` or when retrying from order history.  
   - FE calls `GET /api/payment/vnpay/config`; if `enabled=true` it allows the VNPay radio button.  
   - The checkout form posts to `/cart/checkout` with `paymentMethod=VNPAY`.
2. **`CartController.checkoutCart` logic**
   - Verifies cart is not empty.
   - Creates the `Order` with `paymentMethod=VNPAY`, `paymentStatus=PAYMENT_UNPAID`, and `status=PENDING`.
   - Calls `VnpayService.createPayment(order, clientIp)` which signs the payload and returns `paymentUrl` + `txnRef`.
   - Persists `paymentRef` (= `txnRef`) on the order and returns the URL to the FE.
3. **FE redirect**
   - `SimplePayment.jsx` immediately redirects the browser to `paymentUrl`.
   - Customers complete payment on VNPay’s sandbox/production UI.
4. **VNPay callbacks**
   - VNPay server hits `/api/v1/payment/vnpay/ipn` with signed params.  
     - `PaymentGatewayController` validates the HMAC, loads the order via `paymentRef`, checks amount, and if `vnp_ResponseCode` + `vnp_TransactionStatus` are both `00`, marks the order `status=CONFIRMED`, `paymentStatus=PAID`. Failures flip to `paymentStatus=FAILED`.
   - VNPay redirects the user’s browser to `/api/v1/payment/vnpay/return`.  
     - Controller revalidates the signature and issues an HTTP 302 to `${APP_FRONTEND_URL}/payment-result?status=success|failed&orderId=...&amount=...&message=...`.
5. **Payment result page**
   - `PaymentResult` (formerly `VNPayCallback.jsx`) reads the query params and renders a success/failure view. No additional backend call is required at this stage—the IPN already finalized the order.
6. **Retrying payment**
   - From order history the customer can click “Thanh toán” for VNPay orders that are still unpaid.  
   - FE calls `POST /api/payment/vnpay/order/{orderId}` which reuses `VnpayService` to mint a new link (after verifying the requester owns the order or has admin/staff role).

## Known Issues & Considerations

- **Public URLs required**: VNPay must be able to reach `/api/v1/payment/vnpay/ipn` and `/api/v1/payment/vnpay/return`. When running locally, expose the app via an HTTPS tunnel (ngrok, cloudflared, etc.) and update `vnpay.return-url` / `vnpay.ipn-url` accordingly.
- **Expired links**: VNPay expects you to pay within ~15 minutes (`vnp_ExpireDate`). If a user waits longer, use the “Thanh toán” button in order history to generate a fresh link.
- **Config endpoint 403**: If security rules change, ensure `/api/payment/vnpay/config` stays anonymous (`@PermitAll`). Otherwise the FE cannot determine availability before login.
- **Order state matrix**: IPN marks orders `CONFIRMED`. If you need “Đang giao/Đã giao”, staff/admin must continue updating the order status manually.


