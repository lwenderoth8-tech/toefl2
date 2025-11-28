const mongoose = require('mongoose');

const TestSchema = new mongoose.Schema({
    completedAt: { type: Date, default: Date.now },
    totalScore: Number,
    maxTotalScore: Number,
    results: [{
        textId: String,
        title: String,
        paragraphs: [String], // Snapshot of the text content
        questions: [String],  // Snapshot of questions
        solutions: [String],  // Snapshot of solutions
        score: Number,
        maxScore: Number,
        answers: [{
            questionId: Number,
            userAnswer: String,
            isCorrect: Boolean
        }],
        hints: [{
            type: { type: String, enum: ['translate', 'simplify', 'explain'] },
            selection: String,
            output: String,
            createdAt: { type: Date, default: Date.now }
        }],
        timeSpent: Number
    }]
});

const TranslationSchema = new mongoose.Schema({
    originalText: String,
    translatedText: String,
    type: { type: String, enum: ['translate', 'simplify', 'explain'] },
    language: String,
    createdAt: { type: Date, default: Date.now }
});

const UserSettingsSchema = new mongoose.Schema({
    goal: {
        name: String,
        points: Number
    },
    language: { type: String, default: 'Deutsch' },
    name: { type: String, default: 'Max Mustermann' },
    email: { type: String, default: 'max@example.com' },
    updatedAt: { type: Date, default: Date.now }
});

const TokenUsageSchema = new mongoose.Schema({
    totalTokensUsed: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = {
    Test: mongoose.model('Test', TestSchema),
    Translation: mongoose.model('Translation', TranslationSchema),
    UserSettings: mongoose.model('UserSettings', UserSettingsSchema),
    TokenUsage: mongoose.model('TokenUsage', TokenUsageSchema)
};