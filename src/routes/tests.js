const express = require('express');
const router = express.Router();
const { Test, UserSettings, Translation } = require('../db/models');

// Test speichern
router.post('/save', async (req, res) => {
    try {
        const test = await Test.create(req.body);
        res.json(test);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Verlauf löschen (nur Tests)
router.delete('/history', async (req, res) => {
    try {
        await Test.deleteMany({});
        res.json({ message: 'Verlauf gelöscht' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Alles zurücksetzen
router.delete('/reset', async (req, res) => {
    try {
        await Test.deleteMany({});
        await Translation.deleteMany({});
        await UserSettings.deleteMany({});
        res.json({ message: 'Alles zurückgesetzt' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Test löschen
router.delete('/:id', async (req, res) => {
    try {
        await Test.findByIdAndDelete(req.params.id);
        res.json({ message: 'Test gelöscht' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Einstellungen speichern
router.post('/settings', async (req, res) => {
    try {
        // Update the latest document or create a new one if none exists
        // We use findOneAndUpdate with upsert to handle both cases
        const settings = await UserSettings.findOneAndUpdate(
            {}, // Match any document (since we assume single user for now)
            { ...req.body, updatedAt: Date.now() },
            { new: true, upsert: true, sort: { 'updatedAt': -1 } }
        );
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Statistiken abrufen
router.get('/stats', async (req, res) => {
    try {
        const tests = await Test.find();
        const totalTests = tests.length; // Now counts sessions
        
        let totalScore = 0;
        let maxPossibleScore = 0;
        
        tests.forEach(t => {
            totalScore += t.totalScore || 0;
            maxPossibleScore += t.maxTotalScore || 200; // Default 2 texts * 100
        });

        const averageScore = totalTests > 0 ? Math.round(totalScore / totalTests) : 0;
        const successRate = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

        // Hole gespeichertes Ziel
        const settings = await UserSettings.findOne().sort({ updatedAt: -1 });

        res.json({
            totalTests,
            averageScore,
            successRate,
            goal: settings ? settings.goal : { name: 'Sehr gut bestehen', points: 120 },
            name: settings ? settings.name : 'Max Mustermann',
            email: settings ? settings.email : 'max@example.com',
            language: settings ? settings.language : 'Deutsch'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Verlauf abrufen
router.get('/history', async (req, res) => {
    try {
        const tests = await Test.find().sort({ completedAt: -1 });
        res.json(tests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;