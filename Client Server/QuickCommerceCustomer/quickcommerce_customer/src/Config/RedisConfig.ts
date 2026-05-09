import Redis from "ioredis";

export const redisClient = new Redis({
  host: "127.0.0.1",
  port: 6379,
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  retryStrategy: (times) => Math.min(times * 200, 2000)
});

redisClient.on("error", (err) => {
  console.error("Redis Error:", err);
});

redisClient.on("connect", () => {
  console.log("Redis connected");
});

export const ensureRedisConnection = async () => {
  if (redisClient.status === "wait") {
    await redisClient.connect();
  }
};
