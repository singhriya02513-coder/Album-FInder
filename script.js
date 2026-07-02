let currentAudio = null;
let currentPlayBtn = null;

const artistInput = document.getElementById("artistInput");
const searchBtn = document.getElementById("searchBtn");
const resultDiv = document.getElementById("result");

const API_BASE_URL = window.location.origin;

async function searchArtist() {
  const artist = artistInput.value.trim();

  if (artist === "") {
    showError("Please enter an artist name");
    return;
  }

  showLoading(`Searching for "${artist}"...`);

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/search-artist?artist=${encodeURIComponent(artist)}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Unable to fetch artist data.");
    }

    const data = await response.json();
    displayArtist(data);

  } catch (error) {
    console.error("Error:", error.message);
    showError(error.message);
  }

  artistInput.value = "";
}

function showLoading(message) {
  resultDiv.innerHTML = `<div class="loading">${message}</div>`;
}

function showError(message) {
  resultDiv.innerHTML = `<div class="error-message">${message}</div>`;
}

function displayArtist(data) {
  if (!data) {
    showError("No artist data found.");
    return;
  }

  const albumsHTML = data.albums.length > 0
    ? data.albums.map(album => `
        <a href="${album.url || '#'}" target="_blank" class="album-card" title="Open on Apple Music">
          ${album.image
            ? `<img src="${album.image}" alt="${album.name}" class="album-image" loading="lazy">`
            : '<div class="album-image" style="background: #404040; display: flex; align-items: center; justify-content: center; font-size: 40px;">💿</div>'
          }
          <div class="album-name" title="${album.name}">${album.name}</div>
          <div class="album-year">${album.release_date ? album.release_date.split('-')[0] : ''} · ${album.trackCount} tracks</div>
        </a>
      `).join("")
    : '<p style="color: #b3b3b3; grid-column: 1/-1; text-align: center;">No albums found</p>';

  const songsHTML = data.songs && data.songs.length > 0
    ? data.songs.map((song, i) => `
        <div class="song-card">
          <div class="song-artwork">
            ${song.artwork
              ? `<img src="${song.artwork}" alt="${song.name}" width="48" height="48">`
              : '<div style="width:48px;height:48px;background:#404040;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:20px;">🎵</div>'
            }
          </div>
          <div class="song-info">
            <div class="song-name">${song.name}</div>
            <div class="song-album">${song.albumName}</div>
          </div>
          <button class="play-btn" onclick="togglePlay(this, '${song.previewUrl.replace(/'/g, "\\'")}')" title="Play preview">
            ▶
          </button>
        </div>
      `).join("")
    : '';

  resultDiv.innerHTML = `
    <div class="artist-card">
      <div class="artist-header">
        ${data.image
          ? `<img src="${data.image}" alt="${data.name}" class="artist-image" loading="lazy">`
          : '<div class="artist-image" style="background: #404040; display: flex; align-items: center; justify-content: center; font-size: 60px;">🎤</div>'
        }
        <div class="artist-info">
          <h2>${data.name}</h2>
          ${data.genres.length > 0 ? `
            <div class="artist-genres">
              ${data.genres.slice(0, 3).map(g => `<span class="genre-tag">${g}</span>`).join('')}
            </div>
          ` : ''}
          <a href="${data.url || '#'}" target="_blank" rel="noopener noreferrer" class="apple-music-btn">
            <span>Listen on Apple Music</span>
          </a>
        </div>
      </div>

      ${songsHTML ? `
      <div class="songs-section">
        <h3>Top Songs (30s Preview)</h3>
        <div class="songs-list">
          ${songsHTML}
        </div>
      </div>
      ` : ''}

      ${data.albums.length > 0 ? `
      <div class="albums-section">
        <h3>Albums (${data.albums.length})</h3>
        <div class="albums-grid">
          ${albumsHTML}
        </div>
      </div>
      ` : ''}
    </div>
  `;
}

function togglePlay(button, previewUrl) {
  if (currentAudio && currentAudio.src === previewUrl && !currentAudio.paused) {
    currentAudio.pause();
    button.textContent = '▶';
    button.classList.remove('playing');
    currentAudio = null;
    currentPlayBtn = null;
    return;
  }

  if (currentAudio) {
    currentAudio.pause();
    if (currentPlayBtn) {
      currentPlayBtn.textContent = '▶';
      currentPlayBtn.classList.remove('playing');
    }
  }

  currentAudio = new Audio(previewUrl);
  currentAudio.play();
  button.textContent = '⏸';
  button.classList.add('playing');
  currentPlayBtn = button;

  currentAudio.addEventListener('ended', () => {
    button.textContent = '▶';
    button.classList.remove('playing');
    currentAudio = null;
    currentPlayBtn = null;
  });
}

searchBtn.addEventListener("click", searchArtist);
artistInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    searchArtist();
  }
});

window.addEventListener("load", () => {
  artistInput.focus();
});
