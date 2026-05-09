import { ensureRedisConnection, redisClient } from "../Config/RedisConfig";

export const getCache = async <T>(key: string): Promise<T | null> => {
  await ensureRedisConnection();
  const data = await redisClient.get(key);
  return data ? (JSON.parse(data) as T) : null;
};

export const setCache = async (key: string, value: unknown, ttl = 300): Promise<void> => {
  await ensureRedisConnection();
  await redisClient.set(key, JSON.stringify(value), "EX", ttl);
};

export const deleteByPattern = async (pattern: string): Promise<void> => {
  await ensureRedisConnection();
  const keys = await redisClient.keys(pattern);

  if (keys.length > 0) {
    await redisClient.del(...keys);
  }
};
