import { Redis } from "@upstash/redis";

export const redis = Redis.fromEnv();

// Default time-to-live for cached entries (in seconds).
export const DEFAULT_TTL = 60 * 5; // 5 minutes

/**
 * Key builders so cache keys stay consistent across routes.
 * Keys are namespaced per resource (and per user where data is user-scoped),
 * which lets us invalidate whole families of keys via prefix scans.
 */
export const cacheKeys = {
  collections: (userId: string) => `collections:user:${userId}`,
  collection: (userId: string, id: number) => `collection:${id}:user:${userId}`,
  chapters: (userId: string, collectionId: string) =>
    `chapters:${collectionId}:user:${userId}`,
  presets: (userId: string) => `presets:user:${userId}`,
  attempt: (userId: string, id: number) => `attempt:${id}:user:${userId}`,
  history: (userId: string) => `history:user:${userId}`,
  analytics: (userId: string) => `analytics:user:${userId}`,
};

// Prefixes used for bulk invalidation. Resources are interrelated, so a
// mutation often needs to clear several families at once.
export const cachePrefixes = {
  collections: "collections:",
  collection: "collection:",
  chapters: "chapters:",
  presets: "presets:",
  attempt: "attempt:",
  history: "history:",
  analytics: "analytics:",
};

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get<T>(key);
    if (value !== null && value !== undefined) {
      console.log(`[redis] cache HIT for key "${key}"`);
      return value;
    }
    console.log(`[redis] cache MISS for key "${key}"`);
    return null;
  } catch (error) {
    console.error(`[redis] get error for key "${key}":`, error);
    return null;
  }
}

export async function setCache(
  key: string,
  value: unknown,
  ttl: number = DEFAULT_TTL
): Promise<void> {
  try {
    await redis.set(key, value, { ex: ttl });
  } catch (error) {
    console.error(`[redis] set error for key "${key}":`, error);
  }
}

export async function deleteCache(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch (error) {
    console.error(`[redis] del error for keys "${keys.join(", ")}":`, error);
  }
}

/**
 * Delete every key matching the given prefixes using a non-blocking SCAN.
 * Used to invalidate related cache entries after a mutation.
 */
export async function invalidateByPrefix(...prefixes: string[]): Promise<void> {
  try {
    await Promise.all(
      prefixes.map(async (prefix) => {
        let cursor = "0";
        do {
          const [nextCursor, keys] = await redis.scan(cursor, {
            match: `${prefix}*`,
            count: 100,
          });
          cursor = nextCursor;
          if (keys.length > 0) {
            await redis.del(...keys);
          }
        } while (cursor !== "0");
      })
    );
  } catch (error) {
    console.error(
      `[redis] invalidate error for prefixes "${prefixes.join(", ")}":`,
      error
    );
  }
}
