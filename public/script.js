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
}

async function getCurrMovies() {
    try {
        const apiKey = await fetchApiKey();
        if (!apiKey) {
            throw new Error('Failed to get API key');
        }

        const options = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'accept': 'application/json'
            }
        };

        const response = await fetch('https://api.themoviedb.org/3/movie/now_playing?language=en-US&page=1', options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const moviesData = await response.json();
        const list = document.getElementById('movie-list');
        list.innerHTML = '';
        
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
                 <img class="movie-poster" src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}" data-movie-id="${movie.id} onclick="showMovieDetails(${movie.id})">
                 <button onclick='addtoWatchList("${movie.id}", "${movie.title}", "${movie.poster_path}")'>+</button>
                </div>
            `;
        });
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('movie-list').innerHTML = '<p>Error loading movies</p>';
    }
}

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
            <button class="edit-rating-btn" data-movie-id="${movieID}">Edit Rating</button>
                `;
}

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
            const isWatched = localStorage.getItem(`watched-${movie.id}`) === 'true';
            const storedRating = localStorage.getItem(`rating-${movie.id}`);
            
            const movieElement = `
                <div class="movie-item" data-movie-id="${movie.id}">
                    <h2>${movie.title}</h2>
                    <img src="https://image.tmdb.org/t/p/w500${movie.poster}" alt="${movie.title}">
                    <button onclick="removeFromWatchList('${movie.id}', '${movie.title}', '${movie.poster}')">Remove</button>
                    <div class="watched-rating-container">
                        <div class="watched-container">
                            <input type="checkbox" id="watched-${movie.id}" ${isWatched ? 'checked' : ''}>
                            <label for="watched-${movie.id}">Watched</label>
                        </div>
                        ${isWatched ? `
                            <div class="rating-container" style="display: ${!storedRating ? 'flex' : 'none'}">
                                <label for="rating-${movie.id}">Rating:</label>
                                <input type="number" id="rating-${movie.id}" min="0" max="5" step="0.5" value="${storedRating || ''}" placeholder="Rate (0-5)">
                                <button onclick="submitRating('${movie.id}')">Submit</button>
                            </div>
                            <div class="rating-display" data-movie-id="${movie.id}">
                                ${storedRating ? `Rating: ${storedRating}/5` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
            container.insertAdjacentHTML('beforeend', movieElement);

            // Add event listeners after inserting HTML
            const movieDiv = container.querySelector(`[data-movie-id="${movie.id}"]`);
            const watchedCheckbox = movieDiv.querySelector(`#watched-${movie.id}`);
            const ratingContainer = movieDiv.querySelector('.rating-container');
            const ratingDisplay = movieDiv.querySelector('.rating-display');

            watchedCheckbox.addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                localStorage.setItem(`watched-${movie.id}`, isChecked);
                if (isChecked && !storedRating) {
                    ratingContainer.style.display = 'flex';
                } else {
                    ratingContainer.style.display = 'none';
                }
            });
        });
    } catch (error) {
        console.error('Error fetching watchlist:', error);
        container.innerHTML = '<p>Error loading watchlist</p>';
    }
}

async function updateRatingDisplay(element, rating){
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? "½":"";
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    element.textContent = `${rating}/5 ${ "★".repeat(fullStars) }${ halfStar }${ "☆".repeat(emptyStars)}`;
}

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
}

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
}

async function searchMovies(){
    const apiKey = await fetchApiKey();
    options.headers.Authorization = `Bearer ${apiKey}`;

    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;

    try {
        let movies = await fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=en-US`, options);
        let moviesData = await movies.json();

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
             <img class="movie-poster" src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}" data-movie-id="${movie.id} onclick="showMovieDetails(${movie.id})">
             <button onclick='addtoWatchList("${movie.id}", "${movie.title}", "${movie.poster_path}")'>+</button>
                </div>
            `;
        });

        document.querySelectorAll('.movie-poster').forEach(poster => {
            poster.addEventListener('click', () => {
                const movieID = poster.dataset.id;
                showMovieDetails(movieID);
            });
        });
    } catch (error){
        console.log('Error fetching movies:', error);
    }
};

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

async function showMovieDetails(movieID){
    const apiKey = await fetchApiKey();
    const options = {
        headers: {
            Authorization: `Bearer ${apiKey}`,
        },
    };

    try {
        const response = await fetch(`https://api.themoviedb.org/3/movie/${movieID}?language=en-US`, options);
        const movie = await response.json();

        document.getElementById('detail-title').textContent = movie.title;
        document.getElementById('detail-poster').src = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
        document.getElementById('detail-overview').textContent = movie.overview;

        document.getElementById('movie-details').classList.remove('hidden');
    } catch (error) {
        console.error('Error loading movie details:', error);
    }
}

getCurrMovies();
displayWatchList();

