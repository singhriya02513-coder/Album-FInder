const express = require('express');
const path = require('path');
const app = require('./api/index');

app.use(express.static(path.join(__dirname)));

const startServer = (port) => {
    const server = app.listen(port, () => {
        console.log(`
    🎵 Album Finder Backend Started!
    ✅ Server running on: http://localhost:${port}
    
    Using iTunes API 🍎
    Test: http://localhost:${port}/api/search-artist?artist=Taylor+Swift
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
