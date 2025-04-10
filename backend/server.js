const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());

// Root route
app.get('/', (req, res) => {
    res.send('API Server is running');
});

app.get('/get-api-key', (req, res) => {
    const apiKey = process.env.API_KEY; 
    if (apiKey) {
        res.json({ apiKey });
    } else {
        res.status(500).json({ error: 'API key not found' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});