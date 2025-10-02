import { REDIS_KEYS, redisHelpers } from './redis';

/**
 * Cache Service - Provides high-level caching operations with proper invalidation
 */
export class CacheService {
  /**
   * Get cached data or fetch from database if not cached
   * @param key - Cache key
   * @param fetchFn - Function to fetch data if cache miss
   * @param ttl - Time to live in seconds
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    // Try to get from cache
    const cached = await redisHelpers.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch data
    const data = await fetchFn();

    // Cache the result
    await redisHelpers.setWithExpiry(key, data, ttl);

    return data;
  }

  /**
   * Invalidate cache for a specific key
   */
  async invalidate(key: string): Promise<void> {
    await redisHelpers.delete(key);
  }

  /**
   * Invalidate multiple cache keys
   */
  async invalidateMultiple(...keys: string[]): Promise<void> {
    await redisHelpers.delete(...keys);
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    return await redisHelpers.deleteByPattern(pattern);
  }

  /**
   * Invalidate user-related caches
   */
  async invalidateUserCache(userId: string): Promise<void> {
    await this.invalidateMultiple(
      `${REDIS_KEYS.USER_PROFILE}${userId}`,
      `${REDIS_KEYS.USER_DATA}${userId}`,
      `${REDIS_KEYS.USER_CACHE}${userId}`,
      `${REDIS_KEYS.USER_SKILLS}${userId}`,
      `${REDIS_KEYS.USER_POSTS}${userId}`,
      `${REDIS_KEYS.USER_CONNECTIONS}${userId}`,
      `${REDIS_KEYS.USER_PROJECTS}${userId}*`
    );

    // Also invalidate search results that might contain this user
    await this.invalidatePattern(`${REDIS_KEYS.USER_SEARCH}*`);
  }

  /**
   * Invalidate post-related caches
   */
  async invalidatePostCache(postId: string, authorId?: string): Promise<void> {
    const keysToInvalidate = [
      `${REDIS_KEYS.POST}${postId}`,
      `${REDIS_KEYS.POST_COMMENTS}${postId}`,
      `${REDIS_KEYS.POST_LIKES}${postId}`,
    ];

    if (authorId) {
      keysToInvalidate.push(`${REDIS_KEYS.USER_POSTS}${authorId}`);
    }

    await this.invalidateMultiple(...keysToInvalidate);

    // Invalidate all post feeds
    await this.invalidatePattern(`${REDIS_KEYS.POST_FEED}*`);
  }

  /**
   * Invalidate project-related caches
   */
  async invalidateProjectCache(projectId: string, userId?: string): Promise<void> {
    const keysToInvalidate = [
      `${REDIS_KEYS.PROJECT}${projectId}`,
      `${REDIS_KEYS.PROJECT_TASKS}${projectId}`,
      `${REDIS_KEYS.PROJECT_MEMBERS}${projectId}`,
    ];

    if (userId) {
      keysToInvalidate.push(`${REDIS_KEYS.USER_PROJECTS}${userId}*`);
    }

    await this.invalidateMultiple(...keysToInvalidate);
  }

  /**
   * Invalidate connection-related caches
   */
  async invalidateConnectionCache(userId: string, otherUserId?: string): Promise<void> {
    const keysToInvalidate = [
      `${REDIS_KEYS.USER_CONNECTIONS}${userId}`,
      `${REDIS_KEYS.PENDING_REQUESTS}${userId}`,
    ];

    if (otherUserId) {
      keysToInvalidate.push(
        `${REDIS_KEYS.USER_CONNECTIONS}${otherUserId}`,
        `${REDIS_KEYS.PENDING_REQUESTS}${otherUserId}`
      );
    }

    await this.invalidateMultiple(...keysToInvalidate);
  }

  /**
   * Warm up cache with data
   */
  async warmUp<T>(key: string, data: T, ttl: number): Promise<void> {
    await redisHelpers.setWithExpiry(key, data, ttl);
  }

  /**
   * Check if cache exists
   */
  async exists(key: string): Promise<boolean> {
    return await redisHelpers.exists(key);
  }

  /**
   * Get remaining TTL for a key
   */
  async getTTL(key: string): Promise<number> {
    return await redisHelpers.getTTL(key);
  }
}

// Export singleton instance
export const cacheService = new CacheService();
