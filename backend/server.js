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

//Login endpoint
app.post('/login', express.json(), (req, res) => {
    const {username, password} = req.body;

    const validUser = {
        username: 'bob',
        password: 'bobpass'
    };

    if(username === validUser.username && password === validUser.password){
        res.status(200).json({message: 'Login successful'});
    } else {
        res.status(401).json({error: 'Invalid credentials'});
    }
})
//Register endpoint
app.post('/register', express.json(), (req, res) => {
    const {username, password} = req.body;
    if(username && password){
        res.status(201).json({message: 'Account created successfully'});
    } else {
        res.status(400).json({error: 'Invalid Input'})
    }
})