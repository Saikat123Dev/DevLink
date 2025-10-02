import Redis from "ioredis";

const client = new Redis("rediss://default:AT9OAAIncDJkOWIyZmIxYTgxYWI0YzBjOGRjYzIxNWM4ZmM0YjhmMHAyMTYyMDY@boss-seahorse-16206.upstash.io:6379");

// Redis key prefixes for organization
export const REDIS_KEYS = {
  // Auth keys
  USER_SESSION: 'user:session:',
  USER_DATA: 'user:data:',
  TOKEN_BLACKLIST: 'token:blacklist:',
  REFRESH_TOKEN: 'refresh:token:',
  USER_CACHE: 'user:cache:',

  // User service keys
  USER_PROFILE: 'user:profile:',
  USER_SKILLS: 'user:skills:',
  USER_POSTS: 'user:posts:',
  USER_SEARCH: 'search:users:',

  // Post service keys
  POST: 'post:',
  POST_FEED: 'feed:posts:',
  POST_COMMENTS: 'post:comments:',
  POST_LIKES: 'post:likes:',

  // Project service keys
  PROJECT: 'project:',
  USER_PROJECTS: 'user:projects:',
  PROJECT_TASKS: 'project:tasks:',
  PROJECT_MEMBERS: 'project:members:',

  // Connection service keys
  CONNECTION: 'connection:',
  USER_CONNECTIONS: 'user:connections:',
  PENDING_REQUESTS: 'user:pending:',

  // Notification service keys
  USER_NOTIFICATIONS: 'user:notifications:',
};

// TTL constants (in seconds)
export const TTL = {
  // Auth TTLs
  USER_SESSION: 7 * 24 * 60 * 60, // 7 days (matches access token)
  USER_DATA: 60 * 60, // 1 hour
  REFRESH_TOKEN: 30 * 24 * 60 * 60, // 30 days
  TOKEN_BLACKLIST: 7 * 24 * 60 * 60, // 7 days (matches access token)
  USER_CACHE: 30 * 60, // 30 minutes for frequently accessed user data

  // User service TTLs
  USER_PROFILE: 15 * 60, // 15 minutes - user profiles
  USER_SKILLS: 30 * 60, // 30 minutes - user skills (less frequent changes)
  USER_POSTS: 5 * 60, // 5 minutes - user posts list
  USER_SEARCH: 5 * 60, // 5 minutes - search results

  // Post service TTLs
  POST: 10 * 60, // 10 minutes - individual post
  POST_FEED: 2 * 60, // 2 minutes - post feed (frequently updated)
  POST_COMMENTS: 3 * 60, // 3 minutes - post comments
  POST_LIKES: 5 * 60, // 5 minutes - post likes count

  // Project service TTLs
  PROJECT: 15 * 60, // 15 minutes - project details
  USER_PROJECTS: 10 * 60, // 10 minutes - user's projects list
  PROJECT_TASKS: 5 * 60, // 5 minutes - project tasks (frequently updated)
  PROJECT_MEMBERS: 20 * 60, // 20 minutes - project members

  // Connection service TTLs
  CONNECTION: 30 * 60, // 30 minutes - connection data
  USER_CONNECTIONS: 15 * 60, // 15 minutes - user's connections
  PENDING_REQUESTS: 5 * 60, // 5 minutes - pending requests (frequently checked)

  // Notification service TTLs
  USER_NOTIFICATIONS: 2 * 60, // 2 minutes - notifications (real-time feel)
};

// Helper functions for Redis operations
export const redisHelpers = {
  // Set data with automatic JSON serialization and TTL
  async setWithExpiry<T>(key: string, data: T, ttl: number): Promise<void> {
    await client.setex(key, ttl, JSON.stringify(data));
  },

  // Get data with automatic JSON deserialization
  async get<T>(key: string): Promise<T | null> {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  },

  // Delete one or multiple keys
  async delete(...keys: string[]): Promise<void> {
    if (keys.length > 0) {
      await client.del(...keys);
    }
  },

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    const result = await client.exists(key);
    return result === 1;
  },

  // Set data without expiry
  async set<T>(key: string, data: T): Promise<void> {
    await client.set(key, JSON.stringify(data));
  },

  // Get remaining TTL for a key
  async getTTL(key: string): Promise<number> {
    return await client.ttl(key);
  },

  // Refresh TTL for existing key
  async refreshTTL(key: string, ttl: number): Promise<void> {
    await client.expire(key, ttl);
  },

  // Delete keys by pattern (useful for cache invalidation)
  async deleteByPattern(pattern: string): Promise<number> {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      return await client.del(...keys);
    }
    return 0;
  },

  // Increment a counter
  async increment(key: string): Promise<number> {
    return await client.incr(key);
  },

  // Decrement a counter
  async decrement(key: string): Promise<number> {
    return await client.decr(key);
  },

  // Add item to a set
  async addToSet(key: string, ...members: string[]): Promise<void> {
    await client.sadd(key, ...members);
  },

  // Remove item from a set
  async removeFromSet(key: string, ...members: string[]): Promise<void> {
    await client.srem(key, ...members);
  },

  // Check if item exists in set
  async isInSet(key: string, member: string): Promise<boolean> {
    const result = await client.sismember(key, member);
    return result === 1;
  },

  // Get all members of a set
  async getSetMembers(key: string): Promise<string[]> {
    return await client.smembers(key);
  },
};

export default client;