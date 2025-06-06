const redis = require('redis');

const REDIS_URL = process.env.REDIS_URL;

const redisClient = redis.createClient({ url: REDIS_URL });

redisClient.on('connect', () => console.log('Redis client connected'));
redisClient.on('error', err => console.error('Redis client error:', err));


(async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.error('Failed to connect to Redis:', err);
    }
})();

module.exports = redisClient;
