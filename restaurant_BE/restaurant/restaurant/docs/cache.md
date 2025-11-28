## Redis Cache Strategy

### Connection
- Configured in `RedisConfig`; uses `spring.data.redis.*` props.
- `RedisTemplate<String, Object>` with JSON serializer (Jackson + JavaTime). Null cache disabled.

### Key Structure & Prefixes
| Entity / Purpose | Set/Get Prefix | TTL |
| --- | --- | --- |
| Dish | `dish:` | 30 min |
| Category | `category:` | 1 h |
| User | `user:` | 30 min |
| Order | `order:` | 15 min |
| Cart | `cart:` | 24 h |
| Permission | `permission:` | 2 h |
| Role | `role:` | 2 h |
| Category list | `category:list:` | 10 min |
| User list | `user:list:` | 10 min |
| Order list | `order:list:` | 10 min |
| Permission list | `permission:list:` | 10 min |
| Role list | `role:list:` | 10 min |
| Analytics datasets | `analytics:` | 5 min |

Key examples:
- Single dish: `dish:42`
- Paginated user list: `user:list:page:0:size:20:filters:-123456789`
- Analytics range: `analytics:overview:2025-01-01T00:00Z:2025-01-31T23:59Z:10`

### CacheService API Highlights
- `cacheObject`, `getCachedObject`, `deleteCachedObject`, TTL helpers.
- Entity-specific helpers (e.g., `cacheDish`, `deleteAllDishCache`).
- Pagination helpers: `generatePaginationKey`, list cache CRUD.
- Analytics helpers: `cacheAnalytics`, `deleteAllAnalyticsCache`.

### Usage Patterns
- **Read path**: service checks cache first; fallbacks query DB; cache result.
- **Write path**: after create/update: replace entity cache + invalidate list caches via prefix pattern delete.
- **Delete path**: remove entity key + list prefixes.
- **Session/Cart**: dedicated services use `RedisTemplate` directly for per-user keys (e.g., `cart:{userId}`, `session:{sessionId}`).

### Cache Eviction
- Pattern delete via `redisTemplate.keys(prefix*)` for each entity type.
- `clearAllCache()` flushes entire Redis DB (admin API).
- TTL auto-expiration ensures stale keys removed when redis unreachable.

### Testing & Monitoring
- `CacheService.getTTL(key)` and `hasKey(key)` for diagnostics.
- `getCacheSize()` fetches DB size from Redis connection.
- For manual checks: `redis-cli` → `KEYS dish:*` etc.

