document.addEventListener("DOMContentLoaded", () => {

    const searchHistory = document.getElementById('searchHistory');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const resetButton = document.getElementById('resetButton');
    const loader = document.getElementById('loader');
    const responseContainer = document.getElementById('response');
    const queueContainer = document.querySelector('.queue');

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
        responseContainer.scrollTo({
            top: 0
        });
    }

    // handle fallback image
    function handlefallbackImage(img) {
        const fallbackImage = './podcast-default-png.png';
        img.src = fallbackImage; 
        return img; 
    }

    // setup to load images of podcast/episodes 
    function handleImageLoad(limit) {
        const images = responseContainer.getElementsByTagName('img');
        let imagesToLoad = Math.min(images.length, limit);
        const fallbackImage = './podcast-default-png.png';

        if (imagesToLoad === 0) {
            hideLoader();
            return; 
        }

        Array.from(images).slice(0, limit).forEach(img => {
            img.onload = img.onerror = () => {
                imagesToLoad--;

                if (img.complete && !img.naturalWidth) {
                    img = handlefallbackImage(img);
                }

                if (imagesToLoad === 0) {
                    hideLoader();
                    lazyLoadRemainingImages(limit);
                }

            }
        });
    }

    // Lazy load images after initial load

    function lazyLoadRemainingImages(start) {
        const remainingImages = Array.from(responseContainer.getElementsByTagName('img')).slice(start);
        const lazyLoadObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    let img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.onload = img.onerror = () => {
                            
                            if (img.complete && !img.naturalWidth) {
                                img = handlefallbackImage(img);
                            }
 
                            lazyLoadObserver.unobserve(img);
                        }
                    } else {
                        img = handlefallbackImage(img);
                        lazyLoadObserver.unobserve(img);
                    }
                }
            });
        });

        remainingImages.forEach(img => {
            lazyLoadObserver.observe(img);
        });
    }

    // Search Podcast 
    async function searchPodcast() {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
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
            
            const titles = new Set();

            if (data.feeds && data.feeds.length > 0) {
                data.feeds.forEach((podcast, index) => {
                    if (podcast.episodeCount > 0 && !titles.has(podcast.title)) {
                        titles.add(podcast.title);
                        const card = createCard(podcast);
                        responseContainer.appendChild(card);

                        // Lazy Loading images 
                        if (index >= 25) {
                            card.querySelector('img').dataset.src = card.querySelector('img').src;
                            card.querySelector('img').src = ''; 
                        }
                    }

                    handleImageLoad(25);
                
                });

            } else {
                responseContainer.innerText = 'No results were found.'
            }
        } catch (error) {
            responseContainer.innerText = `Error: ${error.message}`
        }

        // hideLoader();

    }

    // Creating Podcast Card 
    function createCard(podcast) {
        //  Card 
        const card = document.createElement('div');
        card.className = 'card pointer';

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

        card.addEventListener('click', () => {
            loadEpisodes(podcast.itunesId, podcast.episodeCount);
        })

        return card;

    }

    // load episodes 
    async function loadEpisodes(feedId, count) {
        if (!feedId) return;

        showLoader();

        try {
            const response = await fetch(`/api/episodes?feedId=${feedId}&max=${count}`);
            const data = await response.json();

            responseContainer.textContent = '';

            if (data.items && data.items.length > 0) {
                data.items.forEach((episode, index) => {
                    const card = createEpisodeCard(episode);
                    responseContainer.appendChild(card);
                    
                    // Lazy Loading images 
                    if (index >= 25) {
                        card.querySelector('img').dataset.src = card.querySelector('img').src;
                        card.querySelector('img').src = ''; 
                    } 
                });

            } else {
                responseContainer.innerText = 'No results were found.'
            }

            handleImageLoad(25); 

        } catch (error) {
            responseContainer.innerText = `Error: ${error.message}`
        }

        // hideLoader();
    }

    // Create Episode Card
    function createEpisodeCard(episode) {
        //  Card 
        const card = document.createElement('div');
        card.className = 'card';

        // Image
        const img = document.createElement('img');
        img.src = episode.image || episode.feedImage || './podcast-default-png.png';
        img.alt = episode.title;

        // Card content
        const content = document.createElement('div');
        content.className = 'card-content';

        // H3 Title
        const title = document.createElement('h3');
        title.innerText = episode.title;

        // Icon Container
        const iconContainer = document.createElement('div');
        iconContainer.className = 'icon-container';

        const playBtnIcon = document.createElement('button');
        playBtnIcon.innerText = 'Play';
        playBtnIcon.addEventListener('click', () => {
            loadPodcast(episode);
        });

        const queueButton = document.createElement('button');
        // queueButton.className = 'fas fa-list pointer';
        queueButton.innerText = 'Add to Queue';
        queueButton.addEventListener('click', () => {
            addToQueue(episode);
        });
    
        // Description
        const description = document.createElement('p');
        description.innerHTML = episode.description;

        // Publish Date

        const pubDate = document.createElement('p');
        pubDate.className = 'pub-date';
        pubDate.innerText = `Published: ${episode.datePublished ? formatDate(episode.datePublished) : 'Not availble'}`;

        iconContainer.appendChild(pubDate);
        
        // Append into content
        content.appendChild(title);
        iconContainer.appendChild(queueButton);
        iconContainer.appendChild(playBtnIcon);
        content.appendChild(description);
        content.appendChild(pubDate);
        content.appendChild(iconContainer);

        card.appendChild(img);
        card.appendChild(content);
        
        return card;
    }

    // Set Queue Array 
    let queueItems = [];

    // Add item to queue
    function addToQueue(episode) 
    {
        const card = document.createElement('div');
        card.className = 'queue-item';

        const img = document.createElement('img');
        img.src = episode.image || episode.feedImage || './podcast-default-png.png';
        img.alt = episode.title; 

        const content = document.createElement('div');
        content.className = 'queue-content';

        const title = document.createElement('h2');
        title.textContent = episode.title; 


        const iconContainer = document.createElement('div');
        iconContainer.className = 'icon-container';

        const playBtnIcon = document.createElement('i');
        playBtnIcon.className = 'fas fa-play-circle pointer';
        playBtnIcon.title = 'Play Podcast';
        playBtnIcon.addEventListener('click', () => {
            loadPodcast(episode);
        });


        const removeBtnIcon = document.createElement('i');
        removeBtnIcon.className = 'fas fa-trash pointer';
        removeBtnIcon.title = 'Remove from Queue';
        removeBtnIcon.addEventListener('click', () => {
            deleteFromQueue(episode);
        });

        iconContainer.appendChild(playBtnIcon);
        iconContainer.appendChild(removeBtnIcon);
        
        content.appendChild(title);
        content.appendChild(iconContainer);
        
        card.appendChild(img);
        card.appendChild(content);

        queueContainer.appendChild(card);

        saveQueue(episode);

    }

    // Delete Items from queue
    function deleteFromQueue(episode) {
        queueItems = queueItems.filter(item => item.title !== episode.title);
        localStorage.setItem('queue', JSON.stringify(queueItems));

        const queueElements = document.querySelectorAll('.queue-item');
        queueElements.forEach(item => {
            const title = item.querySelector('h2').innerText;
            if (title === episode.title) item.remove();
        });

    }

    // Save Items to queue

    function saveQueue(episode) {
        queueItems.push(episode);
        localStorage.setItem('queue', JSON.stringify(queueItems));
    }

    // load Items from queue
    function loadQueue() {
        const savedQueue = JSON.parse(localStorage.getItem('queue'));
        if (savedQueue) {
            savedQueue.forEach(episode => addToQueue(episode));
        }
    }


    // Navigation ---------------------------- // 
    const searchLink = document.getElementById('searchLink');
    const listenLink = document.getElementById('listenLink');

    const searchContainer = document.querySelector('.search-container');
    const mainContainer = document.querySelector('.main-container');
    const playerContainer = document.querySelector('.player-container');
    // const queueContainer = document.querySelector('.queue'); // appended on top!!!!

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

    // Player logic ----------------------------------------/


    const image = document.getElementById('image');
    const title = document.getElementById('title');
    const playerDatePublished = document.getElementById('datePublished');
    const player = document.getElementById('player');
    const currentTimeEl = document.getElementById('current-time');
    const durationEl = document.getElementById('duration');
    const progress = document.getElementById('progress');
    const progressContainer = document.getElementById('progress-container');
    const prevBtn = document.getElementById('prev');
    const playBtn = document.getElementById('play');
    const nextBtn = document.getElementById('next');


    // Check if Playing
    let isPlaying = false;

    // Play
    function playPodcast() {
        isPlaying = true;
        playBtn.classList.replace('fa-play', 'fa-pause');
        playBtn.setAttribute('title', 'Pause');
        player.play();
    }

    // Pause
    function pausePodcast() {
        isPlaying = false;
        playBtn.classList.replace('fa-pause', 'fa-play');
        playBtn.setAttribute('title', 'Play');
        player.pause();
    }

    // Play or Pause Event Listener
    playBtn.addEventListener('click', () => (isPlaying ? pausePodcast() : playPodcast()));

    // Update Podcast Container
    function loadPodcast(episode) {
        
        currentTimeEl.style.display = 'none';
        durationEl.style.display = 'none';

        title.textContent = episode.title;
        playerDatePublished.textContent = `${episode.datePublished ? formatDate(episode.datePublished) : 'Not availble'}`;
        player.src = episode.enclosureUrl; 
        image.src = episode.image || episode.feedImage || './podcast-default-png.png';
        
        // Reset player 
        player.currentTime = 0; 
        progress.classList.add('loading');
        currentTimeEl.textContent = '0:00';

        player.addEventListener('loadedmetadata', () => {
            const duration = player.duration;
            currentTimeEl.style.display = 'block';
            durationEl.style.display = 'block';
            formatTime(duration, durationEl);
            progress.classList.remove('loading');
            playPodcast();
        });


    }

    // format time function
    function formatTime(time, elName) {
        // Calculate hours, minutes and seconds 
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        let seconds = Math.floor(time % 60);

        // format seconds 
        if (seconds < 10) seconds = `0${seconds}`; 

        // format minutes 
        const formattedMinutes = hours > 0 && minutes < 10 ? `0${minutes}` : minutes; 

        // Display time in hours:minutes:seconds or minutes:seconds 
        if (time) {
            elName.textContent = hours > 0 
                ? `${hours}:${formattedMinutes}:${seconds}`
                : `${minutes}:${seconds}`
        }

    }

    // Skip forward or backward 10 secs
    function skipTime(amount) {
        player.currentTime = Math.max(0, Math.min(player.duration, player.currentTime + amount));
    }

    // Update Progress Bar & Time
    function updateProgressBar(e) {
        const {
            duration,
            currentTime
        } = e.srcElement;
        // Update progress bar width
        const progressPercent = (currentTime / duration) * 100;
        progress.style.width = `${progressPercent}%`;

        // format Time 
        formatTime(duration, durationEl); 
        formatTime(currentTime, currentTimeEl);
    }

    // Set Progress Bar
    function setProgressBar(e) {
        const width = this.clientWidth;
        const clickX = e.offsetX;
        const {
            duration
        } = player;
        player.currentTime = (clickX / width) * duration;
    }

    // Event Listeners
    player.addEventListener('timeupdate', updateProgressBar);
    progressContainer.addEventListener('click', setProgressBar);
    prevBtn.addEventListener('click', () => skipTime(-15));
    nextBtn.addEventListener('click', () => skipTime(15));

    // Check if screen width is less than 1025px
    function isMobileDevice() {
        return window.innerWidth < 1025; 
    }

    // Save the player state to localStorage every 5 secs 

    setInterval(() => {
        
        if (isPlaying) {
            
            const playerState = {
                title: title.textContent,
                datePublished: datePublished.textContent,
                currentTime: player.currentTime,
                duration: player.duration,
                image: image.src,
                src: player.src
            };

            localStorage.setItem('playerState', JSON.stringify(playerState));
        }

    }, 5000);

    // Load Save Player State from localStorage 

    function loadPlayerState() {
        
        const savedState = JSON.parse(localStorage.getItem('playerState'));

        if (savedState) {
            title.textContent = savedState.title;
            datePublished.textContent = savedState.datePublished;
            player.src = savedState.src;     
            image.src = savedState.image;
            player.currentTime = savedState.currentTime;
            formatTime(savedState.currentTime, currentTimeEl);
            player.duration = savedState.duration;
            formatTime(savedState.duration, durationEl);

            progress.style.width = `${(savedState.currentTime / savedState.duration)  * 100}%`;
            if (isMobileDevice()) navigateToPlayer(); 
        }
    }


    // On Statup
    loadPlayerState();
    loadQueue();
});



