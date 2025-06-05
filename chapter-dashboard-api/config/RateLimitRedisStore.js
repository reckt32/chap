class RateLimitRedisStore {
    constructor(options) {
        this.client = options.client;
        this.prefix = options.prefix || 'rl:';
        this.windowMs = options.windowMs;
    }

    async increment(key) {
        const counterKey = this.prefix + key;
        const expiryKey = `${counterKey}:expiry`;

        const [hits, expiry] = await this.client.multi()
            .incr(counterKey)
            .get(expiryKey)
            .exec();

        let resetTime = parseInt(expiry, 10);

        if (!resetTime) {
            resetTime = Date.now() + this.windowMs;
            await this.client.setEx(expiryKey, Math.ceil(this.windowMs / 1000), resetTime.toString());
        }

        return {
            totalHits: parseInt(hits, 10),
            resetTime: new Date(resetTime),
        };
    }

    async decrement(key) {
        await this.client.decr(this.prefix + key);
    }

    async resetKey(key) {
        const counterKey = this.prefix + key;
        const expiryKey = `${counterKey}:expiry`;
        await this.client.del(counterKey, expiryKey);
    }
}

module.exports = RateLimitRedisStore;
