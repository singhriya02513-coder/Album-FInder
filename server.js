require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(cors());

const ITUNES_API = 'https://itunes.apple.com';

async function searchArtistOnItunes(artistName) {
    try {
        console.log(`   Searching iTunes for: "${artistName}"`);

        const searchRes = await axios.get(`${ITUNES_API}/search`, {
            params: {
                term: artistName,
                entity: 'musicArtist',
                limit: 1
            }
        });

        if (!searchRes.data.results.length) {
            console.log("   ❌ No artist found on iTunes");
            return null;
        }

        const artist = searchRes.data.results[0];
        const artistId = artist.artistId;
        console.log(`   ✅ Found artist: ${artist.artistName} (ID: ${artistId})`);

        const [albumRes, songRes] = await Promise.all([
            axios.get(`${ITUNES_API}/lookup`, {
                params: { id: artistId, entity: 'album', limit: 50, sort: 'recent' }
            }),
            axios.get(`${ITUNES_API}/lookup`, {
                params: { id: artistId, entity: 'song', limit: 25 }
            })
        ]);

        const albums = albumRes.data.results
            .filter(item => item.wrapperType === 'collection')
            .map(album => ({
                name: album.collectionName,
                release_date: album.releaseDate ? album.releaseDate.split('T')[0] : 'Unknown',
                image: album.artworkUrl100?.replace('100x100', '300x300') || null,
                trackCount: album.trackCount || 0,
                url: album.collectionViewUrl || null
            }));

        const songs = songRes.data.results
            .filter(item => item.wrapperType === 'track')
            .map(song => ({
                name: song.trackName,
                previewUrl: song.previewUrl || null,
                artwork: song.artworkUrl100 || null,
                albumName: song.collectionName || '',
                url: song.trackViewUrl || null
            }))
            .filter(song => song.previewUrl);

        const artistImage = albums.length > 0 ? albums[0].image : null;

        console.log(`   ✅ ${albums.length} albums, ${songs.length} songs found`);

        return {
            name: artist.artistName,
            image: artistImage,
            genres: artist.primaryGenreName ? [artist.primaryGenreName] : [],
            url: artist.artistLinkUrl || null,
            albums,
            songs
        };

    } catch (error) {
        console.error("   ❌ iTunes search error:", error.message);
        if (error.response) {
            console.error("   ❌ Status:", error.response.status);
            console.error("   ❌ Data:", JSON.stringify(error.response.data));
        }
        return null;
    }
}

app.use(express.static(path.join(__dirname)));

app.get('/search-artist', async (req, res) => {
    try {
        const artistName = req.query.artist;

        if (!artistName) {
            return res.status(400).json({ error: "Artist name required" });
        }

        console.log(`\n🔍 Searching for: ${artistName}`);

        const data = await searchArtistOnItunes(artistName);

        if (!data) {
            return res.status(404).json({ error: "Artist not found on iTunes" });
        }

        console.log(`✅ Found: ${data.name}\n`);
        res.json(data);

    } catch (error) {
        console.error("❌ Error:", error.message);
        res.status(500).json({ error: "Server error: " + error.message });
    }
});

const startServer = (port) => {
    const server = app.listen(port, () => {
        console.log(`
    🎵 Album Finder Backend Started!
    ✅ Server running on: http://localhost:${port}
    
    Using iTunes API 🍎
    Test: http://localhost:${port}/search-artist?artist=Taylor+Swift
        `);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`⚠️ Port ${port} is already in use. Trying port ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('❌ Server error:', err.message);
        }
    });
};

const INITIAL_PORT = parseInt(process.env.PORT, 10) || 5000;
startServer(INITIAL_PORT);
