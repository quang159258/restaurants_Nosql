# API & Permission Matrix

This document summarizes the main REST APIs in the restaurant backend and the roles that are expected to call them.

| Role | Description |
| --- | --- |
| **Guest** | Unauthenticated visitor (landing page, browsing menu) |
| **Customer** | Authenticated end user placing orders |
| **Staff** | Restaurant staff handling kitchen/delivery tasks |
| **Admin** | Manages catalog, orders, users |
| **Super Admin** | Full system control (roles, permissions, analytics) |

## Public / Guest APIs
| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/v1/auth/login` | POST | Authenticate user |
| `/api/v1/auth/register` | POST | Create customer account |
| `/api/v1/auth/refresh` | GET | Refresh access token via cookie |
| `/dish/**`, `/category/**`, `/file/**` | GET | Browse catalog assets |

## Customer APIs
| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/v1/auth/account` | GET | Fetch profile |
| `/api/v1/auth/logout`, `/logout-all` | POST | Logout current/all sessions |
| `/api/v1/auth/change-password` | PUT | Update password |
| `/users` | PUT | Update basic profile (name/phone/gender/address) |
| `/cart`, `/cart/add-dish`, `/cart/update-dish`, `/cart/delete-dish/{id}` | GET/POST/PUT/DELETE | Manage cart |
| `/cart/get-all-dish` | GET | Cart detail listing |
| `/cart/checkout` | POST | Create order (supports `CASH` & `VNPAY`) |
| `/orders/my` | GET | List personal orders |
| `/payment/vnpay/return` | GET | VNPay return (redirects to FE) |

## Staff APIs
| Endpoint | Method | Description |
| --- | --- | --- |
| `/orders/all` | GET | List all orders with filters |
| `/orders/status/{id}` | PUT | Update order status (e.g. CONFIRMED/DELIVERED) |
| `/inventory/**` | POST/PUT | Import stock, adjust inventory |
| `/payment/cash/confirm/{orderId}` | POST | Confirm COD payments |

## Admin APIs
| Endpoint | Method | Description |
| --- | --- | --- |
| `/dish/**` | POST/PUT/DELETE | CRUD dishes |
| `/category/**` | POST/PUT/DELETE | Manage categories |
| `/orders/admin` | POST | Create orders manually |
| `/users` | GET/DELETE | View or remove users |
| `/analytics/overview` | GET | Dashboard metrics |

## Super Admin APIs
| Endpoint | Method | Description |
| --- | --- | --- |
| `/permissions/**` | CRUD | Manage granular permissions |
| `/roles/**` | CRUD | Define roles & assign permissions |
| `/cache/**` | POST/DELETE | Cache maintenance |
| `/storage/**` | POST | Upload/house-keeping tasks |

> Notes:
> - The actual role enforcement is configured in Spring Security via guards (not shown here). This matrix documents the intended ownership to support QA and future permission auditing.
> - VNPay IPN endpoint `/api/v1/payment/vnpay/ipn` is public by design but guarded with signature validation.


