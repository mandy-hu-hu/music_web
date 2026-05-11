export function songKey(song) {
    return song.song_id || `${song.title}#${song.year}#${song.album}`;
}

export function makeSongCard(song, actionLabel, onAction) {
    const card = document.createElement("div");
    card.className = "song-card";

    const img = document.createElement("img");
    const imageUrl = song.img_url || song.image_url || "";

    if (imageUrl) {
        img.src = imageUrl;
    } else {
        img.style.display = "none";
    }

    img.onerror = () => {
        img.style.display = "none";
    };

    img.alt = song.artist || "artist image";
    img.className = "song-img";

    const info = document.createElement("div");
    info.className = "song-info";

    const titleEl = document.createElement("span");
    titleEl.className = "song-title";
    titleEl.textContent = song.title;

    const artistEl = document.createElement("span");
    artistEl.className = "song-artist";
    artistEl.textContent = song.artist;

    const albumEl = document.createElement("span");
    albumEl.className = "song-album";
    albumEl.textContent = song.album + " (" + song.year + ")";

    info.append(titleEl, artistEl, albumEl);

    const btn = document.createElement("button");
    btn.className = actionLabel === "Remove" ? "btn-remove" : "btn-add";
    btn.textContent = actionLabel;
    btn.addEventListener("click", onAction);

    card.append(img, info, btn);
    return card;
}
