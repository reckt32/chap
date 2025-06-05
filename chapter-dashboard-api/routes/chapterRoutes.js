const express = require('express');
const Chapter = require('../models/Chapter');
const redisClient = require('../config/redis');
const { ADMIN_TOKEN } = require('./authRoutes');
const router = express.Router();

const isAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    if (token === ADMIN_TOKEN) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Invalid token.' });
    }
};

router.get('/chapters', async (req, res) => {
    const { page = 1, limit = 10, class: chapterClass, unit, status, weakChapters, subject } = req.query;

    const query = {};
    if (chapterClass) query.class = parseInt(chapterClass);
    if (unit) query.unit = unit;
    if (status) query.status = status;
    if (weakChapters) query.weakChapters = weakChapters === 'true';
    if (subject) query.subject = subject;

    const startIndex = (page - 1) * limit;

    try {
        const cacheKey = `chapters:${JSON.stringify(query)}:page:${page}:limit:${limit}`;
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            console.log('Serving from cache');
            return res.json(JSON.parse(cachedData));
        }

        const totalChapters = await Chapter.countDocuments(query);
        const chapters = await Chapter.find(query)
            .limit(parseInt(limit))
            .skip(startIndex)
            .exec();

        const results = {
            totalChapters,
            currentPage: parseInt(page),
            limit: parseInt(limit),
            chapters
        };

        await redisClient.setEx(cacheKey, 3600, JSON.stringify(results)); 
        console.log('Serving from DB and caching');
        res.json(results);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.get('/chapters/:id', async (req, res) => {
    try {
        const chapter = await Chapter.findById(req.params.id);
        if (!chapter) {
            return res.status(404).json({ message: 'Chapter not found' });
        }
        res.json(chapter);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.post('/chapters', isAdmin, async (req, res) => {
    const chaptersToUpload = req.body;
    if (!Array.isArray(chaptersToUpload) || chaptersToUpload.length === 0) {
        return res.status(400).json({ message: 'Invalid input. Expected an array of chapter objects.' });
    }

    const uploadedChapters = [];
    const failedChapters = [];

    for (const chapterData of chaptersToUpload) {
        try {
            const newChapter = new Chapter(chapterData);
            await newChapter.save();
            uploadedChapters.push(newChapter);
        } catch (error) {
            console.error('Failed to upload chapter:', chapterData, error.message);
            failedChapters.push({ chapter: chapterData, error: error.message });
        }
    }
    const keys = await redisClient.keys('chapters:*');
    if (keys.length > 0) {
        await redisClient.del(keys);
        console.log(`Invalidated ${keys.length} cache keys.`);
    }

    res.status(201).json({
        message: 'Chapter upload process completed.',
        uploadedCount: uploadedChapters.length,
        failedCount: failedChapters.length,
        failedChapters: failedChapters
    });
});

module.exports = router;
