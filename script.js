const options = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: ''
    }
};

async function fetchApiKey(){
    const response = await fetch('http://localhost:3000/get-api-key');
    const data = await response.json();
    return data.apiKey;
};

async function getCurrMovies() { // Fetches the current movies from the API and displays them
    const apiKey = await fetchApiKey();
    options.headers.Authorization = `Bearer ${apiKey}`;

    let movies = await fetch('https://api.themoviedb.org/3/movie/now_playing?language=en-US&page=1', options);
    let moviesData = await movies.json();

    let list = document.getElementById('movie-list');
    list.innerHTML = '';
    moviesData.results.forEach(function (movie) {
        list.innerHTML += `
            <div>
                <a href="javascript:void(0)" onclick="showMovieDetails(${movie.id})">
                    <h2>${movie.title}</h2>
                </a>
                <img class="movie-poster" src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
                <button onclick='addtoWatchList("${movie.id}", "${movie.title}", "${movie.poster_path}")'>+</button>
            </div>
        `;
    });
};

async function addtoWatchList(id, title, poster){
    const token = localStorage.getItem('token');
    if(!token){
        alert('You must be logged in to add movies to your watchlist');
        return;
    }
    try{
        const response = await fetch('http://localhost:3000/add-to-watchlist', {
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

async function updateRatingDisplay(element, rating, movieId) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? "½" : "";
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    element.innerHTML = `
        ${rating}/5 ${"★".repeat(fullStars)}${halfStar}${"☆".repeat(emptyStars)}
        <span class="edit-icon" data-movie-id="${movieId}" title="Edit Rating">🖉</span>
    `;
}


async function displayWatchList() {
    const token = localStorage.getItem('token');
    const container = document.getElementById('watchlist');

    if (!token) {
        container.innerHTML = '<p>You must be logged in to view your watchlist</p>';
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/get-watchlist', {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        container.innerHTML = '';

        if (data.watchlist.length === 0) {
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
                ratingContainer.style.display = isChecked && !localStorage.getItem(`rating-${movie.id}`) ? 'flex' : 'none';
                if (!isChecked) {
                    ratingDisplay.innerHTML = '';
                    localStorage.removeItem(`rating-${movie.id}`);
                }
            });

            ratingInput.addEventListener('change', async () => {
                const rating = parseFloat(ratingInput.value);
                if (rating >= 1 && rating <= 5) {
                    localStorage.setItem(`rating-${movie.id}`, rating);
                    await updateRatingDisplay(ratingDisplay, rating, movie.id);
                    ratingContainer.style.display = 'none';

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
}

async function removeFromWatchList(id, title, poster){
    const token = localStorage.getItem('token');
    if(!token){
        alert('You must be logged in to remove movies from your watchlist');
        return;
    }
    try{
        const response = await fetch('http://localhost:3000/remove-from-watchlist', {
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
            <img class="movie-poster" src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
            <button onclick='addtoWatchList("${movie.id}", "${movie.title}", "${movie.poster_path}")'>+</button>
                </div>
            `;
        });
        
        // clickable posters
        document.querySelectorAll('.movie-poster').forEach(poster => {
            poster.addEventListener('click', () => {
                const movieId = poster.dataset.id;
                showMovieDetails(movieId);
            });
        });

    } catch (error){
        console.log('Error fetching movies:', error);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    getCurrMovies();       // Now safe to run
    displayWatchList();    // Elements exist
});

document.getElementById('searchInput').addEventListener('keypress', (event) => {
    if (event.key === 'Enter'){
        event.preventDefault();
        searchMovies();
    }
});

//event listner for movie titles
document.getElementById('movie-list').addEventListener('click', (event) => {
    const movieId = event.target.dataset.id;

    if (event.target.classList.contains('movie-poster') || event.target.classList.contains('movie-title')) {
        showMovieDetails(movieId);
    }
});

// document.querySelectorAll('.movie-poster').forEach(poster => {
//     poster.addEventListener('click', () => {
//         const movieId = poster.dataset.id;
//         showMovieDetails(movieId);
//     });
// });

document.getElementById('close-details-btn').addEventListener('click', () => {
    document.getElementById('movie-details').classList.add('hidden');
});

displayWatchList();

document.addEventListener("DOMContentLoaded", () => {
    
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
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

       const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({username, password}),
        });
        
        const data = await response.json();
        if(response.ok){
            localStorage.setItem('token', data.token);
            alert('Login Successful');
            closeModal();
            checkAuth();
        } else {
            alert(data.error);
        }
    });
    
    registerModal.addEventListener("submit", async (event) => {
        event.preventDefault();
        const username = document.getElementById("new-username").value;
        const password = document.getElementById("new-password").value;

        const response = await fetch('http://localhost:3000/register', {
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
    const apiKey = await fetchApiKey();
    const options = {
        headers: {
            Authorization: `Bearer ${apiKey}`,
        },
    };

    try {
        const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?language=en-US`, options);
        const movie = await response.json();

        document.getElementById('detail-title').textContent = movie.title;
        document.getElementById('detail-poster').src = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
        document.getElementById('detail-overview').textContent = movie.overview;

        document.getElementById('movie-details').classList.remove('hidden');
    } catch (error) {
        console.error('Error loading movie details:', error);
    }
}

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





