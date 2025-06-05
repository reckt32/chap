const mongoose = require('mongoose');

const ChapterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    class: {
        type: Number,
        required: true
    },
    unit: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['completed', 'in-progress', 'not-started'],
        default: 'not-started'
    },
    weakChapters: {
        type: Boolean,
        default: false
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    topics: [
        {
            name: { type: String, trim: true },
            difficulty: { type: String, enum: ['easy', 'medium', 'hard'] }
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Chapter', ChapterSchema);
