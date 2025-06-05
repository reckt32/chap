require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const redisClient = require('./config/redis'); 
const chapterRoutes = require('./routes/chapterRoutes'); 
const RateLimitRedisStore = require('./config/RateLimitRedisStore'); 
const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));


app.use(express.json()); 

const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute per IP
    message: 'Too many requests from this IP, please try again after a minute',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    keyGenerator: (req) => req.ip, // Use IP address for rate limiting
    store: new RateLimitRedisStore({
        client: redisClient,
        windowMs: 60 * 1000, // Pass windowMs to the store
    }),
});

app.use(limiter);

const authRoutes = require('./routes/authRoutes').router; 
app.use('/api/v1', chapterRoutes);
app.use('/api/v1', authRoutes);

app.get('/', (req, res) => {
    res.send('Chapter Performance Dashboard API');
});

mongoose.connection.once('open', () => {
    console.log('MongoDB connection ready for operations.');
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
