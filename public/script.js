document.addEventListener("DOMContentLoaded", () => {

    const searchHistory = document.getElementById('searchHistory');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const resetButton = document.getElementById('resetButton');
    const loader = document.getElementById('loader');
    const responseContainer = document.getElementById('response');

    // Reset Search History 
    function resetHistory() {
        searchHistory.innerText = '';
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Select a previous Search';
        searchHistory.appendChild(option);
    }

    // Load our search history from localstorage 
    function LoadSearchHistory() {
        const savedSearches = JSON.parse(localStorage.getItem('searchHistory')) || [];
        resetHistory();
        savedSearches.forEach(searchTerm => {
            const option = document.createElement('option');
            option.val = searchTerm;
            option.textContent = searchTerm;
            searchHistory.appendChild(option);
        });
    }

    //  Save serach history to the local storage 
    function saveSearchHistory(searchTerm) {
        let savedSearches = JSON.parse(localStorage.getItem('searchHistory')) || [];

        if (!savedSearches.includes(searchTerm)) {
            savedSearches.push(searchTerm);
            localStorage.setItem('searchHistory', JSON.stringify(savedSearches));
        }

    }

    // Event listner for dropdown change 

    searchHistory.addEventListener('change', () => {
        const selectedSearch = searchHistory.value;
        if (selectedSearch) {
            searchInput.value = selectedSearch;
            searchPodcast();
        }
    })

    //  Event listenr for search button and Input (pressing enter)
    searchButton.addEventListener('click', searchPodcast);
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            searchPodcast();
        }
    })

    //  Event Listener to reset input when focused 
    searchInput.addEventListener('focus', () => {
        searchInput.value = '';
    })

    // Event Listener for clear History (Reset button)
    resetButton.addEventListener('click', () => {
        localStorage.removeItem('searchHistory');
        resetHistory();
        searchInput.value = '';
    });

    // Load search history
    LoadSearchHistory();

    // FormatDate
    function formatDate(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString();
    }

    // Show/Hide loading animation
    function showLoader() {
        loader.style.display = 'flex';
        responseContainer.style.display = 'none';
    }

    function hideLoader() {
        loader.style.display = 'none';
        responseContainer.style.display = 'flex';
    }

    // Search Podcast 
    async function searchPodcast() {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            console.log('Searched : ', searchTerm);
            saveSearchHistory(searchTerm);
            LoadSearchHistory();
        } else {
            responseContainer.innerText = 'Please enter a podcast title';
            return;
        }

        showLoader();

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
            const data = await response.json();

            responseContainer.textContent = '';

            if (data.feeds && data.feeds.length > 0) {
                // console.log(data.feeds);
                data.feeds.forEach((podcast) => {
                    const card = createCard(podcast);
                    responseContainer.appendChild(card);
                });
            } else {
                responseContainer.innerText = 'No results were found.'
            }
        } catch (error) {
            responseContainer.innerText = `Error: ${error.message}`
        }

        hideLoader();

    }

    // Creating Podcast Card 
    function createCard(podcast) {
        //  Card 
        const card = document.createElement('div');
        card.className = 'card';

        // Image
        const img = document.createElement('img');
        img.src = podcast.image || './podcast-default-png.png';
        img.alt = podcast.title;

        // Card content
        const content = document.createElement('div');
        content.className = 'card-content';

        // H3 Title
        const title = document.createElement('h3');
        title.innerText = podcast.title;

        // Description
        const description = document.createElement('p');
        description.innerText = podcast.description;

        // Episode Count
        const episodeCount = document.createElement('p');
        episodeCount.className = 'episode-count';
        episodeCount.innerText = `Episodes: ${podcast.episodeCount}`;

        // Publish Date
        const pubDate = document.createElement('p');
        pubDate.className = 'pub-date';
        pubDate.innerText = `Newest Episode: ${podcast.newestItemPubdate ? formatDate(podcast.newestItemPubdate) : 'Not availble'}`;

        // Append into content
        content.appendChild(title);
        content.appendChild(description);
        content.appendChild(episodeCount);
        content.appendChild(pubDate);

        card.appendChild(img);
        card.appendChild(content);

        return card;

    }






    // Navigation ---------------------------- // 
    const searchLink = document.getElementById('searchLink');
    const listenLink = document.getElementById('listenLink');

    const searchContainer = document.querySelector('.search-container');
    const mainContainer = document.querySelector('.main-container');
    const playerContainer = document.querySelector('.player-container');
    const queueContainer = document.querySelector('.queue');

    searchLink.addEventListener('click', navigateToSearch);
    listenLink.addEventListener('click', navigateToPlayer);

    function navigateToSearch() {
        searchContainer.style.display = 'flex';
        mainContainer.style.display = 'flex';
        playerContainer.style.display = 'none';
        queueContainer.style.display = 'none';
        searchLink.classList.add('selected');
        listenLink.classList.remove('selected');
    }

    function navigateToPlayer() {
        searchContainer.style.display = 'none';
        mainContainer.style.display = 'none';
        playerContainer.style.display = 'flex';
        queueContainer.style.display = 'flex';
        searchLink.classList.remove('selected');
        listenLink.classList.add('selected');
    }

});





// const image = document.querySelector('img');
// const title = document.getElementById('title');
// const artist = document.getElementById('artist');
// const music = document.querySelector('audio');
// const currentTimeEl = document.getElementById('current-time');
// const durationEl = document.getElementById('duration');
// const progress = document.getElementById('progress');
// const progressContainer = document.getElementById('progress-container');
// const prevBtn = document.getElementById('prev');
// const playBtn = document.getElementById('play');
// const nextBtn = document.getElementById('next');

// // Music
// const songs = [{
//         name: 'jacinto-1',
//         displayName: 'Electric Chill Machine',
//         artist: 'Jacinto Design',
//     },
//     {
//         name: 'jacinto-2',
//         displayName: 'Seven Nation Army (Remix)',
//         artist: 'Jacinto Design',
//     },
//     {
//         name: 'jacinto-3',
//         displayName: 'Goodnight, Disco Queen',
//         artist: 'Jacinto Design',
//     },
//     {
//         name: 'metric-1',
//         displayName: 'Front Row (Remix)',
//         artist: 'Metric/Jacinto Design',
//     },
// ];

// // Check if Playing
// let isPlaying = false;

// // Play
// function playSong() {
//     isPlaying = true;
//     playBtn.classList.replace('fa-play', 'fa-pause');
//     playBtn.setAttribute('title', 'Pause');
//     music.play();
// }

// // Pause
// function pauseSong() {
//     isPlaying = false;
//     playBtn.classList.replace('fa-pause', 'fa-play');
//     playBtn.setAttribute('title', 'Play');
//     music.pause();
// }

// // Play or Pause Event Listener
// playBtn.addEventListener('click', () => (isPlaying ? pauseSong() : playSong()));

// // Update DOM
// function loadSong(song) {
//     title.textContent = song.displayName;
//     artist.textContent = song.artist;
//     music.src = `music/${song.name}.mp3`;
//     image.src = `img/${song.name}.jpg`;
// }

// // Current Song
// let songIndex = 0;

// // Previous Song
// function prevSong() {
//     songIndex--;
//     if (songIndex < 0) {
//         songIndex = songs.length - 1;
//     }
//     loadSong(songs[songIndex]);
//     playSong();
// }

// // Next Song
// function nextSong() {
//     songIndex++;
//     if (songIndex > songs.length - 1) {
//         songIndex = 0;
//     }
//     loadSong(songs[songIndex]);
//     playSong();
// }

// // On Load - Select First Song
// loadSong(songs[songIndex]);

// // Update Progress Bar & Time
// function updateProgressBar(e) {
//     if (isPlaying) {
//         const {
//             duration,
//             currentTime
//         } = e.srcElement;
//         // Update progress bar width
//         const progressPercent = (currentTime / duration) * 100;
//         progress.style.width = `${progressPercent}%`;
//         // Calculate display for duration
//         const durationMinutes = Math.floor(duration / 60);
//         let durationSeconds = Math.floor(duration % 60);
//         if (durationSeconds < 10) {
//             durationSeconds = `0${durationSeconds}`;
//         }
//         // Delay switching duration Element to avoid NaN
//         if (durationSeconds) {
//             durationEl.textContent = `${durationMinutes}:${durationSeconds}`;
//         }
//         // Calculate display for currentTime
//         const currentMinutes = Math.floor(currentTime / 60);
//         let currentSeconds = Math.floor(currentTime % 60);
//         if (currentSeconds < 10) {
//             currentSeconds = `0${currentSeconds}`;
//         }
//         currentTimeEl.textContent = `${currentMinutes}:${currentSeconds}`;
//     }
// }

// // Set Progress Bar
// function setProgressBar(e) {
//     const width = this.clientWidth;
//     const clickX = e.offsetX;
//     const {
//         duration
//     } = music;
//     music.currentTime = (clickX / width) * duration;
// }

// // Event Listeners
// prevBtn.addEventListener('click', prevSong);
// nextBtn.addEventListener('click', nextSong);
// music.addEventListener('ended', nextSong);
// music.addEventListener('timeupdate', updateProgressBar);
// progressContainer.addEventListener('click', setProgressBar);