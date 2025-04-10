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
                <h2><strong>${movie.title}</h2>
                <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
            </div>
        `;
    });
}
getCurrMovies();  