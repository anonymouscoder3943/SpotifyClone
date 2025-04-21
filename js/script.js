console.log("Lets write JavaScript");
let currentSong = new Audio();
let songs;
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, "0");
    const formattedSeconds = String(remainingSeconds).padStart(2, "0");

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`/${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            let url = new URL(element.href);
            let pathname = decodeURIComponent(url.pathname);
            let filename = pathname.split("/").pop();

            songs.push(filename);
        }
    }

    // Show all the songs in the playlist
    let songUL = document
        .querySelector(".songList")
        .getElementsByTagName("ul")[0];
    songUL.innerHTML = "";
    for (const song of songs) {
        songUL.innerHTML =
            songUL.innerHTML +
            `<li><img class="invert" width="34" src="img/music.svg" alt="">
                            <div class="info">
                                <div> ${song.replaceAll("%20", " ")}</div>
                                <div>Harry</div>
                            </div>
                            <div class="playnow">
                                <span>Play Now</span>
                                <img class="invert" src="img/play.svg" alt="">
                            </div> </li>`;
    }

    // Attach an event listener to each song
    Array.from(
        document.querySelector(".songList").getElementsByTagName("li")
    ).forEach((e) => {
        e.addEventListener("click", (element) => {
            playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
        });
    });

    return songs;
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track;
    if (!pause) {
        currentSong.play();
        play.src = "img/pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";

    // Add code to display cover image
    let folderName = currFolder.split('/').pop();
    let coverPath = `/songs/${folderName}/cover.jpg`;
    let albumArtDiv = document.querySelector(".songbuttons");

    // Create or update the album art image
    let albumArt = document.querySelector(".albumArt");
    if (!albumArt) {
        albumArt = document.createElement("img");
        albumArt.classList.add("albumArt");
        albumArt.style.width = "50px";
        albumArt.style.height = "50px";
        albumArt.style.borderRadius = "5px";
        albumArt.style.marginRight = "10px";
        albumArtDiv.prepend(albumArt);
    }

    albumArt.src = coverPath;
    albumArt.alt = "Album Art";
};

async function displayAlbums() {
    console.log("📂 Fetching /songs/");

    try {
        const res = await fetch("/songs/");
        const html = await res.text();

        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;

        const anchors = Array.from(tempDiv.getElementsByTagName("a"));
        const cardContainer = document.querySelector(".cardContainer");

        for (const anchor of anchors) {
            const href = anchor.getAttribute("href");
            if (!href || href === "../" || href === ".htaccess") continue;

            const folderName = decodeURIComponent(href.replace(/\/$/, ""));

            try {
                const infoRes = await fetch(`/songs/${folderName}/info.json`);
                const { title, description } = await infoRes.json();

                cardContainer.innerHTML += `
            <div data-folder="${folderName}" class="card">
              <div class="play">▶️</div>
              <img src="/songs/${folderName}/cover.jpg" alt="${title} cover">
              <h2>${title}</h2>
              <p>${description}</p>
            </div>
          `;
            } catch (err) {
                console.warn(`Skipping "${folderName}" - Missing or invalid info.json`);
            }
        }

        document.querySelectorAll(".card").forEach((card) => {
            card.addEventListener("click", async() => {
                const folder = card.dataset.folder;
                songs = await getSongs(`songs/${folder}`);
                playMusic(songs[0]);
            });
        });
    } catch (err) {
        console.error("Failed to fetch /songs/ folder", err);
    }
}

async function main() {
    // Get the list of all the songs
    await getSongs("songs/ncs");
    playMusic(songs[0], true);

    // Display all the albums on the page
    await displayAlbums();

    // Add event listeners to Play buttons in the All Songs section
    document.querySelectorAll('.playSongBtn').forEach(button => {
        button.addEventListener('click', function() {
            const songItem = this.closest('.songItem');
            const folder = songItem.dataset.folder;
            const song = songItem.dataset.song;

            // Set current folder and load songs
            currFolder = `songs/${folder}`;

            // Load the songs from this folder and play the selected song
            getSongs(currFolder).then(() => {
                playMusic(song);
            });
        });
    });

    // Attach an event listener to play, next and previous
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "img/pause.svg";
        } else {
            currentSong.pause();
            play.src = "img/play.svg";
        }
    });

    // Listen for timeupdate event
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(
      currentSong.currentTime
    )} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left =
            (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // Add an event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", (e) => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    // Add an event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    // Add an event listener for close button
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Add an event listener to previous
    previous.addEventListener("click", () => {
        currentSong.pause();
        console.log("Previous clicked");

        // Fix song indexing
        let currentSongFile = currentSong.src.split("/").pop();
        currentSongFile = decodeURIComponent(currentSongFile);

        console.log("Current song file:", currentSongFile);
        console.log("Songs array:", songs);

        let index = songs.indexOf(currentSongFile);
        console.log("Current index:", index);

        if (index - 1 >= 0) {
            playMusic(songs[index - 1]);
        }
    });

    // Add an event listener to next
    next.addEventListener("click", () => {
        currentSong.pause();
        console.log("Next clicked");

        // Fix song indexing
        let currentSongFile = currentSong.src.split("/").pop();
        currentSongFile = decodeURIComponent(currentSongFile);

        console.log("Current song file:", currentSongFile);
        console.log("Songs array:", songs);

        let index = songs.indexOf(currentSongFile);
        console.log("Current index:", index);

        if (index + 1 < songs.length) {
            playMusic(songs[index + 1]);
        }
    });

    // Add an event to volume
    document
        .querySelector(".range")
        .getElementsByTagName("input")[0]
        .addEventListener("change", (e) => {
            console.log("Setting volume to", e.target.value, "/ 100");
            currentSong.volume = parseInt(e.target.value) / 100;
            if (currentSong.volume > 0) {
                document.querySelector(".volume>img").src = document
                    .querySelector(".volume>img")
                    .src.replace("mute.svg", "volume.svg");
            }
        });

    // Add event listener to mute the track
    document.querySelector(".volume>img").addEventListener("click", (e) => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            currentSong.volume = 0;
            document
                .querySelector(".range")
                .getElementsByTagName("input")[0].value = 0;
        } else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            currentSong.volume = 0.1;
            document
                .querySelector(".range")
                .getElementsByTagName("input")[0].value = 10;
        }
    });
}

main();