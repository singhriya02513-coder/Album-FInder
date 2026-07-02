const axios = require('axios');

const ITUNES_API = 'https://itunes.apple.com';

async function searchArtistOnItunes(artistName) {
    try {
        const searchRes = await axios.get(`${ITUNES_API}/search`, {
            params: {
                term: artistName,
                entity: 'musicArtist',
                limit: 1
            }
        });

        if (!searchRes.data.results.length) {
            return null;
        }

        const artist = searchRes.data.results[0];
        const artistId = artist.artistId;

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

        return {
            name: artist.artistName,
            image: artistImage,
            genres: artist.primaryGenreName ? [artist.primaryGenreName] : [],
            url: artist.artistLinkUrl || null,
            albums,
            songs
        };

    } catch (error) {
        console.error("iTunes search error:", error.message);
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data));
        }
        return null;
    }
}

module.exports = { searchArtistOnItunes };
