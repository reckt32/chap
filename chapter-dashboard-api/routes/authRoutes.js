const express = require('express');
const router = express.Router();

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'supersecretadmintoken';

router.post('/auth/login', (req, res) => {
    const { username, password } = req.body;

    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        res.json({ message: 'Login successful', token: ADMIN_TOKEN });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

module.exports = { router, ADMIN_TOKEN };
