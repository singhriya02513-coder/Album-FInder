require('dotenv').config();
const express = require('express');
const path = require('path');
const { searchArtistOnItunes } = require('../itunes');

const app = express();
app.use(express.static(path.join(__dirname, '..')));

app.get('/api/search-artist', async (req, res) => {
    try {
        const artistName = req.query.artist;
        if (!artistName) {
            return res.status(400).json({ error: "Artist name required" });
        }
        const data = await searchArtistOnItunes(artistName);
        if (!data) {
            return res.status(404).json({ error: "Artist not found on iTunes" });
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Server error: " + error.message });
    }
});

module.exports = app;
