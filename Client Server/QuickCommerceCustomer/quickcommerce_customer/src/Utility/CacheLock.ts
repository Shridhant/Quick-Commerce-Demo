import { ensureRedisConnection, redisClient } from "../Config/RedisConfig";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getOrSetWithLock = async <T>(
  key: string,
  fetchFunction: () => Promise<T>,
  ttl = 300
): Promise<T> => {
  try {
    await ensureRedisConnection();

    const cached = await redisClient.get(key);

    if (cached) {
      return JSON.parse(cached) as T;
    }

    const lockKey = `lock:${key}`;
    const isLocked = await redisClient.set(lockKey, "1", "EX", 10, "NX");

    if (isLocked === "OK") {
      try {
        const data = await fetchFunction();
        await redisClient.set(key, JSON.stringify(data), "EX", ttl);
        return data;
      } finally {
        await redisClient.del(lockKey);
      }
    }

    for (let attempt = 0; attempt < 5; attempt++) {
      await delay(100);
      const retry = await redisClient.get(key);
      if (retry) {
        return JSON.parse(retry) as T;
      }
    }
  } catch (error) {
    console.error(`Cache error for key ${key}:`, error);
  }

  return fetchFunction();
};

export const getLatestOrCached = async <T>(
  key: string,
  fetchFunction: () => Promise<T>,
  ttl = 300
): Promise<T> => {
  try {
    const latestData = await fetchFunction();

    try {
      await ensureRedisConnection();
      await redisClient.set(key, JSON.stringify(latestData), "EX", ttl);
    } catch (cacheWriteError) {
      console.error(`Cache write error for key ${key}:`, cacheWriteError);
    }

    return latestData;
  } catch (fetchError) {
    console.error(`Primary fetch failed for key ${key}:`, fetchError);

    try {
      await ensureRedisConnection();
      const cached = await redisClient.get(key);

      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch (cacheReadError) {
      console.error(`Cache fallback error for key ${key}:`, cacheReadError);
    }

    throw fetchError;
  }
};
