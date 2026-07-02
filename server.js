require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { searchArtistOnItunes } = require('./itunes');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname)));

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
        console.error("Error:", error.message);
        res.status(500).json({ error: "Server error: " + error.message });
    }
});

const startServer = (port) => {
    const server = app.listen(port, () => {
        console.log(`
    Album Finder Backend Started!
    Server running on: http://localhost:${port}

    Using iTunes API
    Test: http://localhost:${port}/api/search-artist?artist=Taylor+Swift
        `);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is already in use. Trying port ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Server error:', err.message);
        }
    });
};

const INITIAL_PORT = parseInt(process.env.PORT, 10) || 5000;
startServer(INITIAL_PORT);
