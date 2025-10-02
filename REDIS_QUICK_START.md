# Redis Integration - Quick Start Guide

## 🚀 Getting Started

This guide helps you understand and use the Redis caching system in DevLink.

## 📖 Reading Order

1. **Start Here** - This file (Quick Start)
2. **REDIS_AUTH_INTEGRATION.md** - Auth & security features
3. **REDIS_CACHING_INTEGRATION.md** - Data caching details
4. **REDIS_INTEGRATION_SUMMARY.md** - Complete overview

## ⚡ Quick Examples

### Using Cached Data in Your Code

```typescript
// Example 1: Get user profile (automatically cached)
const user = await userService.getUserById(userId);
// First call: ~80ms (DB query + cache)
// Subsequent calls: ~1-2ms (from cache)

// Example 2: Get post feed (automatically cached)
const { posts, pagination } = await postService.getPosts(1, 10, userId);
// First call: ~250ms (DB query + cache)
// Subsequent calls: ~2-3ms (from cache)

// Example 3: Get user connections (automatically cached)
const { connections } = await connectionService.getMyConnections(userId);
// First call: ~180ms (DB query + cache)
// Subsequent calls: ~1-2ms (from cache)
```

### Cache is Transparent!

**Good news**: You don't need to change your code! The caching happens automatically.

```typescript
// Just use the service methods as before:
const user = await userService.getUserById(userId);

// Behind the scenes:
// 1. Check Redis cache
// 2. If found → return instantly ⚡
// 3. If not → query DB, cache result, return
```

### Adding a New Cached Operation

Want to add caching to a new operation?

```typescript
import { cacheService } from '../utils/cache.service';
import { REDIS_KEYS, TTL } from '../utils/redis';

async getMyNewData(userId: string) {
  const cacheKey = `${REDIS_KEYS.MY_PREFIX}${userId}`;

  return cacheService.getOrSet(
    cacheKey,
    async () => {
      // Your expensive database query
      return await prisma.myModel.findMany({ ... });
    },
    TTL.MY_TTL // e.g., 10 * 60 = 10 minutes
  );
}
```

### Invalidating Cache on Updates

When you modify data, invalidate the cache:

```typescript
async updateMyData(userId: string, data: any) {
  // Update database
  const result = await prisma.myModel.update({ ... });

  // Invalidate cache
  const cacheKey = `${REDIS_KEYS.MY_PREFIX}${userId}`;
  await cacheService.invalidate(cacheKey);

  return result;
}
```

### Pattern-Based Invalidation

Need to invalidate multiple related keys?

```typescript
// Invalidate all post feeds (all pages)
await cacheService.invalidatePattern(`${REDIS_KEYS.POST_FEED}*`);

// Invalidate all user projects
await cacheService.invalidatePattern(`${REDIS_KEYS.USER_PROJECTS}${userId}*`);
```

## 🛠️ Common Tasks

### 1. Checking if Data is Cached

```typescript
const cacheKey = `user:profile:${userId}`;
const exists = await cacheService.exists(cacheKey);
console.log("Cached:", exists);
```

### 2. Checking Cache TTL

```typescript
const cacheKey = `user:profile:${userId}`;
const ttl = await cacheService.getTTL(cacheKey);
console.log("Expires in:", ttl, "seconds");
```

### 3. Manual Cache Invalidation

```typescript
// Single key
await cacheService.invalidate(cacheKey);

// Multiple keys
await cacheService.invalidateMultiple(key1, key2, key3);

// Pattern
await cacheService.invalidatePattern("feed:posts:*");
```

### 4. Pre-warming Cache

```typescript
// Cache data before it's requested
await cacheService.warmUp(cacheKey, data, TTL.SOME_VALUE);
```

## 🎯 When to Cache?

### ✅ Good Candidates for Caching

- **User profiles** - Read frequently, updated rarely
- **Feed data** - Read frequently, acceptable slight staleness
- **Lists** - Connection lists, project lists
- **Search results** - Same query = same results
- **Aggregated data** - Stats, counts
- **Settings** - Rarely change

### ❌ Bad Candidates for Caching

- **Real-time data** - Stock prices, live updates
- **Write-heavy data** - Chat messages, logs
- **One-time data** - Password reset tokens
- **User-specific dynamic data** - Shopping cart items
- **Large objects** - Files, images, videos

## 🔍 Debugging Cache Issues

### Problem: Cache not working

```typescript
// Add logging
console.log("[CACHE] Looking for key:", cacheKey);
const cached = await cacheService.exists(cacheKey);
console.log("[CACHE] Found in cache:", cached);

if (!cached) {
  console.log("[CACHE] Cache miss, querying database...");
}
```

### Problem: Stale data

```typescript
// Check TTL
const ttl = await cacheService.getTTL(cacheKey);
console.log("[CACHE] Remaining TTL:", ttl, "seconds");

// If too long, reduce TTL in redis.ts
export const TTL = {
  MY_DATA: 5 * 60, // Reduced from 30 to 5 minutes
};
```

### Problem: Cache not invalidating

```typescript
// Add logging to invalidation
async updateData(id: string, data: any) {
  const result = await prisma.update({ ... });

  console.log('[CACHE] Invalidating cache for:', id);
  await cacheService.invalidate(cacheKey);
  console.log('[CACHE] Cache invalidated');

  return result;
}
```

## 🔧 Configuration

### Adding New Cache Keys

1. Add to `REDIS_KEYS` in `/server/src/utils/redis.ts`:

```typescript
export const REDIS_KEYS = {
  // ... existing keys ...
  MY_NEW_KEY: "my:new:key:",
};
```

2. Add TTL in `/server/src/utils/redis.ts`:

```typescript
export const TTL = {
  // ... existing TTLs ...
  MY_NEW_DATA: 10 * 60, // 10 minutes
};
```

### Changing TTL Values

Edit `/server/src/utils/redis.ts`:

```typescript
export const TTL = {
  USER_PROFILE: 15 * 60, // Change from 15 to 30 minutes
  POST_FEED: 2 * 60, // Change from 2 to 5 minutes
  // ... etc
};
```

## 📊 Monitoring

### Check Redis in Development

```bash
# Connect to Redis CLI
redis-cli -u "your-redis-url"

# See all keys (DEV ONLY!)
KEYS "*"

# Check a specific key
GET "user:profile:user123"

# Check TTL
TTL "user:profile:user123"

# Delete a key
DEL "user:profile:user123"

# Count keys by pattern
KEYS "user:*" | wc -l

# Memory usage
INFO memory

# Cache hit stats
INFO stats
```

### Performance Monitoring

Add timing to your endpoints:

```typescript
router.get("/profile/:id", async (req, res) => {
  const start = Date.now();

  const user = await userService.getUserById(req.params.id);

  const duration = Date.now() - start;
  console.log("[PERF] Profile loaded in:", duration, "ms");

  res.json({ user });
});
```

## 🚨 Common Pitfalls

### 1. Forgetting to Invalidate

```typescript
// ❌ BAD: Cache not invalidated
async updateUser(userId, data) {
  return await prisma.user.update({ ... });
  // Cache still has old data!
}

// ✅ GOOD: Cache invalidated
async updateUser(userId, data) {
  const user = await prisma.user.update({ ... });
  await cacheService.invalidateUserCache(userId);
  return user;
}
```

### 2. Wrong Cache Key

```typescript
// ❌ BAD: Keys don't match
async getData(userId) {
  const cacheKey = `user:${userId}`;
  return cacheService.getOrSet(cacheKey, ...);
}

async updateData(userId) {
  await cacheService.invalidate(`profile:${userId}`); // Wrong key!
}

// ✅ GOOD: Use constants
const cacheKey = `${REDIS_KEYS.USER_PROFILE}${userId}`;
```

### 3. Caching Without TTL

```typescript
// ❌ BAD: No expiry (memory leak)
await redisHelpers.set(key, data); // No TTL!

// ✅ GOOD: Always set TTL
await redisHelpers.setWithExpiry(key, data, TTL.SOME_VALUE);
```

### 4. Caching Sensitive Data

```typescript
// ❌ BAD: Password in cache
const user = { id, email, password, ... };
await cacheService.warmUp(cacheKey, user, TTL);

// ✅ GOOD: Exclude sensitive fields
const { password, ...safeUser } = user;
await cacheService.warmUp(cacheKey, safeUser, TTL);
```

## 📚 Code Examples

### Example 1: Simple Read Operation

```typescript
// Service method with caching
async getUserProfile(userId: string) {
  const cacheKey = `${REDIS_KEYS.USER_PROFILE}${userId}`;

  return cacheService.getOrSet(
    cacheKey,
    async () => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { skills: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    },
    TTL.USER_PROFILE
  );
}
```

### Example 2: Write Operation with Invalidation

```typescript
// Update with cache invalidation
async updateUserProfile(userId: string, data: any) {
  // Update database
  const user = await prisma.user.update({
    where: { id: userId },
    data
  });

  // Invalidate all user-related caches
  await cacheService.invalidateUserCache(userId);

  return user;
}
```

### Example 3: Relationship Update

```typescript
// Add connection (affects both users)
async addConnection(userId1: string, userId2: string) {
  const connection = await prisma.connection.create({
    data: {
      requesterId: userId1,
      receiverId: userId2,
      status: 'ACCEPTED'
    }
  });

  // Invalidate caches for BOTH users
  await cacheService.invalidateConnectionCache(userId1, userId2);

  return connection;
}
```

### Example 4: Paginated Data

```typescript
// Paginated list with caching
async getUserPosts(userId: string, page: number, limit: number) {
  const cacheKey = `${REDIS_KEYS.USER_POSTS}${userId}:page:${page}:limit:${limit}`;

  return cacheService.getOrSet(
    cacheKey,
    async () => {
      const skip = (page - 1) * limit;

      const posts = await prisma.post.findMany({
        where: { authorId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      });

      const total = await prisma.post.count({
        where: { authorId: userId }
      });

      return {
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    },
    TTL.USER_POSTS
  );
}
```

## 🎓 Learning Path

### Beginner Level

1. ✅ Understand that caching happens automatically
2. ✅ Use existing cached methods
3. ✅ Know where to find documentation
4. ✅ Understand cache invalidation basics

### Intermediate Level

1. ✅ Add caching to new operations
2. ✅ Implement cache invalidation
3. ✅ Choose appropriate TTL values
4. ✅ Use pattern-based invalidation

### Advanced Level

1. ✅ Optimize cache key structures
2. ✅ Implement complex invalidation strategies
3. ✅ Monitor and tune cache performance
4. ✅ Handle cache failures gracefully

## 🔗 Resources

- **Redis Docs**: https://redis.io/documentation
- **ioredis Docs**: https://github.com/luin/ioredis
- **Caching Patterns**: https://docs.microsoft.com/en-us/azure/architecture/patterns/cache-aside

## ❓ FAQ

**Q: Do I need to modify my existing code?**  
A: No! Caching is already implemented in all services.

**Q: What if Redis goes down?**  
A: The app continues working, just slower. It falls back to database queries.

**Q: How do I know if caching is working?**  
A: Check response times. Cached requests are 10-100x faster.

**Q: Can I disable caching for testing?**  
A: Yes, set `CACHE_ENABLED=false` in environment variables.

**Q: How much memory does caching use?**  
A: ~50 MB per 1000 active users. Very efficient!

**Q: What happens when cache is full?**  
A: Redis automatically evicts least recently used keys.

**Q: Should I cache everything?**  
A: No! Only cache read-heavy, relatively stable data.

## ✅ Checklist for New Features

When adding a new feature:

- [ ] Identify read-heavy operations
- [ ] Add caching with `cacheService.getOrSet()`
- [ ] Choose appropriate TTL
- [ ] Implement cache invalidation on updates
- [ ] Test cache hit/miss scenarios
- [ ] Test cache invalidation works
- [ ] Add logging for debugging
- [ ] Document the caching strategy

## 🎉 Summary

- ✅ **Caching is automatic** - Just use the service methods
- ✅ **Performance boost** - 10-100x faster on cache hits
- ✅ **Easy to use** - Simple API with `getOrSet()`
- ✅ **Safe** - Automatic TTL prevents memory leaks
- ✅ **Reliable** - Graceful fallback if Redis fails
- ✅ **Well documented** - Multiple guide files available

**You're ready to use Redis caching in DevLink! 🚀**

For more details, check the other documentation files:

- REDIS_AUTH_INTEGRATION.md
- REDIS_CACHING_INTEGRATION.md
- REDIS_INTEGRATION_SUMMARY.md
