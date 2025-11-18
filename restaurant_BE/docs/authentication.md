# Authentication Overview (JWT + Session Hybrid)

The Java backend combines **JWT-based stateless auth** with a **server-side session registry**. This hybrid model keeps each HTTP request simple (bearer tokens) while still allowing central control over login sessions (tracking multiple devices, invalidating them, etc.). Below is a breakdown of the two layers and why both are used.

---

## 1. JWT Tokens

### What we issue
| Token | Where | Purpose | Lifetime |
| --- | --- | --- | --- |
| Access Token | HTTP response payload | Sent as `Authorization: Bearer <token>` on every API call | Default ~100 days (configurable) |
| Refresh Token | HttpOnly cookie `refresh_token` | Used only to mint a new access token when the old one expires | Matches `restaurant.jwt.refresh-token-validity` |

### Creation flow
1. User posts credentials to `/api/v1/auth/login`.
2. Spring Security authenticates via `AuthenticationManagerBuilder`.
3. `SecurityUtil.createAccessToken()` signs a JWT with user id, email, role, and other claims.
4. `SecurityUtil.createRefreshToken()` generates a longer-lived JWT or opaque string.
5. Refresh token is stored in the database via `UserService.updateUserToken(...)` and also set as an HttpOnly cookie.

### Usage
- Clients include the access token in `Authorization: Bearer ...`.
- When it expires, the frontend calls `/api/v1/auth/refresh`, which validates the refresh token cookie, issues a new access token, and rotates the refresh token.
- Tokens are self-contained; we do not query the database on every request. This keeps APIs fast and scalable across nodes.

### Benefits
- Stateless authorization checks (no server-side session lookup required per request).
- Works well for public APIs, mobile apps, multiple frontends.
- Easy to horizontal scale — any instance can validate JWTs.

---

## 2. Server-side Session Tracking

JWT alone cannot answer questions like “how many devices has this user logged in from?” or “force logout from all other devices.” To cover that gap we maintain a simple session registry backed by Redis:

1. On successful login we call `SessionService.createSession(userId, userAgent, ip)`.
2. The generated `SESSIONID` is stored in a secure, HttpOnly cookie.
3. `SessionValidationFilter` runs early in the Spring filter chain to ensure the session is still valid. If the session was deleted (logout-all, admin action, etc.), requests are rejected even if the JWT is valid.
4. We expose `/api/v1/auth/logout` to remove the current session and `/api/v1/auth/logout-all` to drop every session for the current user (and their refresh token), forcing re-auth everywhere.

### Benefits
- **Centralized logout**: By deleting entries in Redis we can immediately cut off old browsers/devices even if they still hold a valid access token.
- **Session auditing**: We can track metadata like login time, IP, device, and expose it to the user via account-security screens (future work).
- **Rate limiting / concurrency control**: Because each session is tracked, we can enforce “max 3 concurrent devices” or similar policies.

---

## Why use both?

| Requirement | JWT only | Session only | Hybrid (current) |
| --- | --- | --- | --- |
| Scale across multiple servers | ✅ | ⚠️ (needs sticky sessions) | ✅ |
| Stateless API calls | ✅ | ❌ | ✅ |
| Force logout from all devices | ❌ (token revocation is tricky) | ✅ | ✅ |
| Track devices & metadata | ❌ | ✅ | ✅ |
| Rotate tokens without blocking | ✅ | ⚠️ (session store overhead) | ✅ |

The hybrid approach gives us the best of both:
- Primary auth/authorization is stateless and fast (JWT).
- Critical account-level operations (logout, session list, concurrency) operate on the Redis session store.

---

## Integration checkpoints

| Component | Files / Classes | Notes |
| --- | --- | --- |
| Login & tokens | `AuthController`, `SecurityUtil`, `UserService` | Issues access + refresh tokens, writes session cookie |
| Session store | `SessionService`, `SessionValidationFilter` | Persists session info, injects into filter chain |
| Logout | `/auth/logout`, `/auth/logout-all` | Deletes session(s), clears cookies, rotates tokens |
| Refresh flow | `/auth/refresh` | Validates refresh token cookie, checks DB, issues new tokens |
| Authorization | `@PreAuthorize` annotations + token claims | Roles/permissions enforced per endpoint |

No current bugs are known in the hybrid setup; just ensure Redis is available (for session storage) and the JWT secrets are configured. If either subsystem is down, logins may fail or sessions may not be validated.

