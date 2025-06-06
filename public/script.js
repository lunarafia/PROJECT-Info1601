const API_BASE_URL = "https://us-central1-whattowatch-4343a.cloudfunctions.net/api";

const options = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: ''
    }
};

async function fetchApiKey(){
    try {
        const response = await fetch(`${API_BASE_URL}/get-api-key`);
        const data = await response.json();
        return data.apiKey;
    } catch (error) {
        console.error('Error fetching API key:', error);
        throw error;
    }
};

let currentPage = 1;
let totalPages = null;

async function getCurrMovies(page = 1) {
    try {
        const apiKey = await fetchApiKey();
        if (!apiKey) {
            throw new Error('Failed to get API key');
        }
        
        const list = document.getElementById('movie-list');
        list.innerHTML = '';

        const options = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'accept': 'application/json'
            }
        };

        const response = await fetch(`https://api.themoviedb.org/3/movie/now_playing?language=en-US&page=${page}`, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const moviesData = await response.json();
        totalPages = moviesData.total_pages;
        
        
        if (!moviesData.results) {
            list.innerHTML = '<p>No movies found</p>';
            return;
        }

        moviesData.results.forEach(movie => {
            list.innerHTML += `
                <div>
            <a href="javascript:void(0)" onclick="showMovieDetails(${movie.id})">
                <h2>${movie.title}</h2>
            </a>
            <div class="movie-poster-container">
                <img class="movie-poster" 
                     src="https://image.tmdb.org/t/p/w500${movie.poster_path}" 
                     alt="${movie.title}" 
                     data-movie-id="${movie.id}">
                <div class="poster-overlay">
                    <button class="poster-button" onclick="showMovieDetails(${movie.id})">
                         ⓘ
                    </button>
                    <button class="poster-button" onclick='addtoWatchList("${movie.id}", "${movie.title}", "${movie.poster_path}")'>
                        +
                    </button>
                </div>
            </div>
        </div>
            `;
        });
        updatePaginationButton();

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('movie-list').innerHTML = '<p>Error loading movies</p>';
    }
    
    
    function updatePaginationButton(){
        document.getElementById('prev-button').style.display = (currentPage > 1) ? 'inline-block':'none';
        document.getElementById('next-button').style.display = (currentPage < totalPages) ? 'inline-block' : 'none';
        document.getElementById('page-info').textContent = `Page ${currentPage}`;
    }
};
function loadPrevPage(){
        if(currentPage > 1){
            currentPage--;
            getCurrMovies(currentPage);
        }
    };
    
function loadNextPage(){
        if(currentPage < totalPages){
            currentPage++;
            getCurrMovies(currentPage);
        }
    };

async function addtoWatchList(id, title, poster){
    const token = localStorage.getItem('token');
    if(!token){
        alert('You must be logged in to add movies to your watchlist');
        return;
    }
    try{
        const response = await fetch(`${API_BASE_URL}/add-to-watchlist`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({id, title, poster}),
        });

        if(response.ok){
            alert(`${title} has been added to your watchlist`);
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to add movie to watchlist');
        }
    } catch (error){
        console.error('Error adding to watchlist:', error);
    }
};

async function updateRatingDisplay(element, rating, movieID){
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? "½":"";
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    element.innerHTML = `
        ${rating}/5
        ${"★".repeat(fullStars)}${halfStar}${"☆".repeat(emptyStars)}
            <span class="edit-rating-btn" data-movie-id="${movieID}" title="Edit Rating" style="cursor: pointer">🖉</span>
                `;
};

async function displayWatchList() {
    const token = localStorage.getItem('token');
    const container = document.getElementById('watchlist');

    if (!container) {
        console.error('Watchlist container not found');
        return;
    }

    if (!token) {
        container.innerHTML = '<p>You must be logged in to view your watchlist</p>';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/get-watchlist`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json();
        container.innerHTML = '';

        if (!data.watchlist || data.watchlist.length === 0) {
            container.innerHTML = '<p>Your watchlist is empty</p>';
            return;
        }

        data.watchlist.forEach((movie) => {
            const movieDiv = document.createElement('div');
            movieDiv.classList.add('movie-item');
            movieDiv.dataset.movieId = movie.id;

            const isWatched = localStorage.getItem(`watched-${movie.id}`) === 'true';
            const storedRating = localStorage.getItem(`rating-${movie.id}`);

            movieDiv.innerHTML = `
                <h2>${movie.title}</h2>
                <img src="https://image.tmdb.org/t/p/w500${movie.poster}" alt="${movie.title}" onclick="showMovieDetails('${movie.id}')">
                <button onclick='removeFromWatchList("${movie.id}", "${movie.title}", "${movie.poster}")'>-</button>
                <div class="watched-rating-container">
                    <div class="watched-container">
                        <input type="checkbox" id="watched-${movie.id}" ${isWatched ? 'checked' : ''}>
                        <label for="watched-${movie.id}">Watched</label>
                    </div>
                    <div class="rating-container" style="display: ${isWatched && !storedRating ? 'flex' : 'none'}; margin-top: 10px;">
                        <label for="rating-${movie.id}">Rating:</label>
                        <input type="number" id="rating-${movie.id}" min="1" max="5" placeholder="1-5">
                    </div>
                </div>
                <div class="rating-display" data-movie-id="${movie.id}" style="margin-top: 10px;"></div>
            `;

            container.appendChild(movieDiv);

            const watchedCheckbox = movieDiv.querySelector(`#watched-${movie.id}`);
            const ratingInput = movieDiv.querySelector(`#rating-${movie.id}`);
            const ratingContainer = movieDiv.querySelector('.rating-container');
            const ratingDisplay = movieDiv.querySelector(`.rating-display[data-movie-id="${movie.id}"]`);

            if (storedRating && isWatched) {
                updateRatingDisplay(ratingDisplay, storedRating, movie.id);
                ratingContainer.style.display = 'none';
            }

            watchedCheckbox.addEventListener('change', async (event) => {
                const isChecked = event.target.checked;
                localStorage.setItem(`watched-${movie.id}`, isChecked);
                
                // Add null checks
                if (ratingContainer && ratingDisplay) {
                    if (isChecked && !localStorage.getItem(`rating-${movie.id}`)) {
                        ratingContainer.style.display = 'flex';
                    } else {
                        ratingContainer.style.display = 'none';
                    }
                    if (!isChecked) {
                        ratingDisplay.innerHTML = '';
                        localStorage.removeItem(`rating-${movie.id}`);
                    }
                }
            });

            ratingInput.addEventListener('change', async () => {
                const rating = parseFloat(ratingInput.value);
                if (rating >= 1 && rating <= 5) {
                    localStorage.setItem(`rating-${movie.id}`, rating);
                    if (ratingDisplay && ratingContainer) {
                        await updateRatingDisplay(ratingDisplay, rating, movie.id);
                        ratingContainer.style.display = 'none';
                    }
                    // Attach edit button listener
                    const editBtn = ratingDisplay.querySelector('.edit-rating-btn');
                    editBtn.addEventListener('click', () => {
                        ratingContainer.style.display = 'flex';
                        ratingInput.value = localStorage.getItem(`rating-${movie.id}`) || '';
                        ratingDisplay.innerHTML = '';

                        // Allow re-submitting the same rating
                        ratingInput.addEventListener('input', async () => {
                            const updatedRating = parseFloat(ratingInput.value);
                            if (updatedRating >= 1 && updatedRating <= 5) {
                                localStorage.setItem(`rating-${movie.id}`, updatedRating);
                                await updateRatingDisplay(ratingDisplay, updatedRating, movie.id);
                                ratingContainer.style.display = 'none';
                            }
                        });
                    });
                }
            });

            // Handle initial edit icon listener
            const initEditIcon = movieDiv.querySelector('.edit-icon');
            if (initEditIcon) {
                initEditIcon.addEventListener('click', () => {
                    ratingContainer.style.display = 'flex';
                    ratingInput.value = storedRating;
                    ratingDisplay.innerHTML = '';
                });
            }
        });
    } catch (error) {
        console.error('Error fetching watchlist:', error);
    }
};


async function removeFromWatchList(id, title, poster){
    const token = localStorage.getItem('token');
    if(!token){
        alert('You must be logged in to remove movies from your watchlist');
        return;
    }
    try{
        const response = await fetch(`${API_BASE_URL}/remove-from-watchlist`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({id, title, poster}),
        });

        if(response.ok){
            alert('Movie removed from watchlist');
            displayWatchList();
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to remove movie from watchlist');
        }
    } catch (error){
        console.error('Error removing from watchlist:', error);
    }
};

async function handleWatchedChange(event) {
    const movieId = event.target.closest('.movie-item').dataset.movieId;
    const isWatched = event.target.checked;
    localStorage.setItem(`watched-${movieId}`, isWatched);
};

async function handleRatingChange(event) {
    const movieItem = event.target.closest('.movie-item');
    const movieId = movieItem.dataset.movieId;
    const rating = parseFloat(event.target.value);

    if (isNaN(rating) || rating < 0 || rating > 5) {
        alert("Please enter a valid rating between 0 and 5.");
        return;
    }

    localStorage.setItem(`rating-${movieId}`, rating);

    const ratingDisplay = movieItem.querySelector(`.rating-display[data-movie-id="${movieId}"]`);
    if (ratingDisplay) {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5 ? "½" : "";
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

        const starText = "★".repeat(fullStars) + halfStar + "☆".repeat(emptyStars);
        ratingDisplay.textContent = `${rating}/5 ${starText}`;
    }
};

let searchPage = 1;
let searchTotalPages = null;
let currentSearchQuery = '';

async function searchMovies(page = 1){
    const apiKey = await fetchApiKey();
    options.headers.Authorization = `Bearer ${apiKey}`;

    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;

    currentSearchQuery = query;
    searchPage = page;

    try {
        let movies = await fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=en-US&page=${page}`, options);
        let moviesData = await movies.json();

        searchTotalPages = moviesData.total_pages;

        let list = document.getElementById('movie-list');
        let now = document.getElementById('now');
        now.innerHTML = '';
        list.innerHTML = '';
        moviesData.results.forEach(function (movie){
            list.innerHTML += `
                <div>
            <a href="javascript:void(0)" onclick="showMovieDetails(${movie.id})">
                <h2>${movie.title}</h2>
            </a>
            <div class="movie-poster-container">
                <img class="movie-poster" 
                     src="https://image.tmdb.org/t/p/w500${movie.poster_path}" 
                     alt="${movie.title}" 
                     data-movie-id="${movie.id}">
                <div class="poster-overlay">
                    <button class="poster-button" onclick="showMovieDetails(${movie.id})">
                        ⓘ
                    </button>
                    <button class="poster-button" onclick='addtoWatchList("${movie.id}", "${movie.title}", "${movie.poster_path}")'>
                        +
                    </button>
                </div>
            </div>
        </div>
            `;
        });

        updateSearchPaginationButtons();

        document.querySelectorAll('.movie-poster').forEach(poster => {
            poster.addEventListener('click', () => {
                const movieID = poster.dataset.id;
                showMovieDetails(movieID);
            });
        });
    } catch (error){
        console.log('Error fetching movies:', error);
    }
    function updateSearchPaginationButtons(){
        document.getElementById('prev-button').style.display = (searchPage > 1) ? 'inline-block':'none';
        document.getElementById('next-button').style.display = (searchPage < searchTotalPages) ? 'inline-block' : 'none';
        document.getElementById('page-info').textContent = `Page ${searchPage}`;
    }
};
function loadNextSearchPage(){
    if(searchPage < searchTotalPages){
        searchMovies(searchPage + 1);
    }
};
function loadPrevSearchPage(){
    if(searchPage > 1){
        searchMovies(searchPage - 1);
    }
};

getCurrMovies(currentPage);
displayWatchList();

document.getElementById('next-button').addEventListener('click', () => {
    if (currentSearchQuery) {
        loadNextSearchPage();
    } else {
        loadNextPage();
    }
});

document.getElementById('prev-button').addEventListener('click', () => {
    if (currentSearchQuery) {
        loadPrevSearchPage();
    } else {
        loadPrevPage();
    }
});



document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('movie-list')?.addEventListener('click', (event) => {
        if (event.target.classList.contains('movie-poster')) {
            const movieID = event.target.dataset.movieId;
            if (movieID) {
                showMovieDetails(movieID);
            }
        }
    });
   
    const openModalButton = document.getElementById("open-login-modal");
    const loginModal = document.getElementById("login-modal");
    const closeModalButton = document.getElementsByClassName("close-btn");
    const registerButton = document.getElementById("show-register");
    const registerModal = document.getElementById("register-modal");
    const loginButton = document.getElementById("show-login");
    const body = document.body;
    const sidebar = document.getElementById("sidebar");
    const toggleSidebar = document.getElementById("toggle-sidebar");
    const logout = document.getElementById("logout");

   

    // Add these event listeners here instead
    document.getElementById('close-details-btn')?.addEventListener('click', () => {
        document.getElementById('movie-details').classList.add('hidden');
        // Remove blur class when closing details
        document.body.classList.remove('details-active');
    });

    document.getElementById('searchInput')?.addEventListener('keypress', (event) => {
        if (event.key === 'Enter'){
            event.preventDefault();
            searchMovies();
        }
    });

    // Open the modal
    openModalButton.addEventListener("click", () => {
        loginModal.classList.remove("hidden");
        body.classList.add("modal-active");
    });

    //Clost the modal when the escape key is pressed
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && (!loginModal.classList.contains("hidden") || !registerModal.classList.contains("hidden"))) {
            closeModal();
        }
    });

    //Close the modal when close button is clicked
    Array.from(closeModalButton).forEach((button) => {
        button.addEventListener("click", () => {
            closeModal();
        });
    });
    
    // Show register form when "Register" is clicked
    registerButton.addEventListener("click", () => {
        loginModal.classList.add("hidden");
        registerModal.classList.remove("hidden");
    });

    //Show login form when "Login" is clicked
    loginButton.addEventListener("click", () => {
        registerModal.classList.add("hidden");
        loginModal.classList.remove("hidden");
    });

    //Function to close the modal
    function closeModal(){

        loginModal.classList.add("hidden");
        registerModal.classList.add("hidden");
        body.classList.remove("modal-active");
    }

    //Handles login submission
    loginModal.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({username, password}),
            });
            
            const data = await response.json();
            if(response.ok) {
                localStorage.setItem('token', data.token);
                alert('Login Successful');
                closeModal();
                checkAuth();
            } else {
                alert(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Failed to login. Please try again.');
        }
    });
    
    registerModal.addEventListener("submit", async (event) => {
        event.preventDefault();
        const username = document.getElementById("new-username").value;
        const password = document.getElementById("new-password").value;

        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({username, password}),
        });

        if (response.ok){
            const data = await response.json();
            alert(data.message);
            closeModal();
        } else {
            const error = await response.json();
            alert(error.error);
        }
    });

    function checkAuth() {
        const token = localStorage.getItem('token');

        if (token) {
            toggleSidebar.classList.remove("hidden");
            openModalButton.classList.add("hidden");
        } else {
            toggleSidebar.classList.add("hidden");
            openModalButton.classList.remove("hidden");
        }

        document.getElementById('open-login-modal')?.addEventListener("click", () => {
            loginModal.classList.remove("hidden");
            body.classList.add("modal-active");
        });

    }

    toggleSidebar.addEventListener("click",() => {
        if(sidebar.classList.contains("show")){
            sidebar.classList.remove("show");
            sidebar.classList.add("hidden");
        } else {
            sidebar.classList.remove("hidden");
            sidebar.classList.add("show");
        }
        
    });
    const closeSidebar = document.getElementById("close-btn");
    closeSidebar.addEventListener("click", () => {
        sidebar.classList.remove("show"); 
        sidebar.classList.add("hidden");
    })

    logout.addEventListener("click", () => {
        localStorage.removeItem("token");
        alert("You have been logged out.");
        checkAuth();
        sidebar.classList.remove("show");
    });
    checkAuth();
});

async function showMovieDetails(movieId) {
    try {
        // Add blur class when showing details
        document.body.classList.add('details-active');
        
        // First, get the API key
        const apiKey = await fetchApiKey();
        if (!apiKey) {
            throw new Error('Failed to get API key');
        }

        // Set up options with the API key
        const options = {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }
        };

        // Fetch movie details first
        const movieRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?language=en-US`, options);
        const movie = await movieRes.json();
        
        if (!movie) {
            throw new Error('Movie details not found');
        }

        // Set basic details
        document.getElementById('detail-title').textContent = movie.title;
        document.getElementById('detail-poster').src = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
        document.getElementById('detail-overview').textContent = movie.overview || 'No overview available.';
        document.getElementById('detail-release-date').textContent = movie.release_date || 'N/A';

        // Fetch cast info
        const creditsRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/credits?language=en-US`, options);
        const creditsData = await creditsRes.json();
        
        // Add null check for cast data
        const topCast = creditsData?.cast 
            ? creditsData.cast.slice(0, 5).map(actor => actor.name).join(', ')
            : 'Cast information unavailable.';
        document.getElementById('detail-cast').textContent = topCast;

        // Fetch trailer
        const videosRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?language=en-US`, options);
        const videosData = await videosRes.json();
        const trailer = videosData?.results?.find(video => video.type === 'Trailer' && video.site === 'YouTube');

        const trailerContainer = document.getElementById('trailer-container');
        trailerContainer.innerHTML = trailer
            ? `<iframe width="560" height="315" src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allowfullscreen></iframe>`
            : '<p>No trailer available.</p>';

        // Show the detail view
        document.getElementById('movie-details').classList.remove('hidden');
        document.getElementById('movie-details').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Error fetching movie details:', error);
        document.getElementById('movie-details').innerHTML = '<p>Error loading movie details. Please try again later.</p>';
    }
};





