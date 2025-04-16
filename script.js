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
}

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
                <h2>${movie.title}</h2>
                <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
            </div>
        `;
    });
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
        list.innerHTML = '';
        moviesData.results.forEach(function (movie){
            list.innerHTML += `
                <div>
                    <h2>${movie.title}</h2>
                    <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
                </div>
            `;
        });
    } catch (error){
        console.log('Error fetching movies:', error);
    }
}
document.getElementById('searchInput').addEventListener('keypress', (event) => {
    if (event.key === 'Enter'){
        event.preventDefault();
        searchMovies();
    }
})
getCurrMovies();

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

