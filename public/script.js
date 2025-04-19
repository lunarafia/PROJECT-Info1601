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
                    <h2>${movie.title}</h2>
                    <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
                    <button onclick="addtoWatchList('${movie.id}', '${movie.title}', '${movie.poster_path}')">+</button>
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

async function displayWatchList(){
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

        if (data.watchlist.length === 0) {
            container.innerHTML = '<p>Your watchlist is empty</p>';
            return;
        }

        data.watchlist.forEach((movie) => {
            const movieDiv = document.createElement('div');
            movieDiv.innerHTML = `
                <h2>${movie.title}</h2>
                <img src="https://image.tmdb.org/t/p/w500${movie.poster}" alt="${movie.title}">
                <button onclick='removeFromWatchList("${movie.id}", "${movie.title}", "${movie.poster}")'>-</button>
            `;
            container.appendChild(movieDiv);
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
                    <h2>${movie.title}</h2>
                    <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
                    <button onclick='addtoWatchList("${movie.id}", "${movie.title}", "${movie.poster_path}")'>+</button>
                </div>
            `;
        });
    } catch (error){
        console.log('Error fetching movies:', error);
    }
};
document.getElementById('searchInput').addEventListener('keypress', (event) => {
    if (event.key === 'Enter'){
        event.preventDefault();
        searchMovies();
    }
});
getCurrMovies();
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

