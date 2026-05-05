document.getElementById("queryForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("title").value;
    const artist = document.getElementById("artist").value;
    const year = document.getElementById("year").value;
    const album = document.getElementById("album").value;

    const params = new URLSearchParams({
        title,
        artist,
        year,
        album
    });

    fetch("http://100.31.2.68:5000/music?" + params.toString())
        .then(res => res.json())
        .then(data => {
            console.log("MUSIC:", data);

            const resultDiv = document.getElementById("results");

            if (!data.items || data.items.length === 0) {
                resultDiv.innerHTML = "<p>No result</p>";
                return;
            }

            resultDiv.innerHTML = data.items.map(song => `
                <div>
                    <h3>${song.title}</h3>
                    <p>${song.artist} (${song.year})</p>
                    <p>${song.album}</p>
                </div>
            `).join("");
        })
        .catch(err => {
            console.error(err);
        });
});
