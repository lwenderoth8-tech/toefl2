require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Frontend Dateien

// Datenbank Verbindung
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Verbunden mit MongoDB'))
    .catch(err => console.error('❌ MongoDB Fehler:', err));

// Routen
app.use('/api/ai', require('./src/routes/ai'));
app.use('/api/tests', require('./src/routes/tests'));

// Catch-all Route für Single Page Application (SPA)
// Wichtig für Hosting: Alle unbekannten Routen gehen an index.html
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server läuft auf Port ${PORT}`);
});