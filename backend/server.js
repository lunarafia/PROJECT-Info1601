import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { storeUserData, readUserData }  from './firestore.js';
import { doc, updateDoc, arrayRemove, arrayUnion, getDoc  } from 'firebase/firestore';
import {firestore } from './firebase.js';

dotenv.config();

const app = express();
const PORT = 3000;

const corsOptions = {
    origin: 'https://whattowatch-4343a.web.app', // Allow this specific origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
};

app.use(cors(corsOptions)); // Apply CORS middleware with options
app.use(express.json());

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
app.post('/login', async (req, res) => {
    const {username, password} = req.body;
    const secretKey = process.env.JWT_SECRET;

    try{
        const snap = await readUserData(username);
        if(!snap.exists()){
            return res.status(400).json({error: 'User Not Found'});
        }
        const user = snap.data();
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch){
            return res.status(400).json({error: 'Invalid Password'});
        }
        const token = jwt.sign({username}, secretKey, {expiresIn: '24h'});
        res.status(200).json({message: 'Login Successful', token});
    } catch (error){
        console.error('Error Logging In:', error);
        res.status(500).json({error: 'Failed to Login'});
    }
});  
//Register endpoint
app.post('/register', async (req, res) => {
    const {username, password} = req.body;
    
    const hashPassword = await bcrypt.hash(password, 10);
    try{
        await storeUserData(username, username, hashPassword);
        res.status(201).json({message: 'Account created successfully'});
    } catch (error){
        console.error('Error storing user data:', error);
        res.status(500).json({error: 'Failed to create account'});
    }
});

//Protect route
app.get('/protected', (req, res) => {
    const authHeader = req.headers.authorization;
    const secretKey = process.env.JWT_SECRET;
    if(!authHeader){
        return res.status(401).json({error: 'Authorization header missing'});
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, secretKey, (err, user) => {
        if (err){
            return res.status(403).json({error: 'Invalid or expired token'});
        }
        res.status(200).json({message:'Protected route accessed', user});
    })
});
app.post('/add-to-watchlist', async (req, res) => {
    const {id, title, poster} = req.body;
    const authHeader = req.headers.authorization;
    const secretKey = process.env.JWT_SECRET;

    if(!authHeader){
        return res.status(401).json({message: 'Authorization header missing'});
    }
    const token = authHeader.split(' ')[1];
    try{
        const decoded = jwt.verify(token, secretKey);
        const userDoc = doc(firestore, 'users', decoded.username);
        
        await updateDoc(userDoc, {
            watchlist: arrayUnion({id, title, poster}),
        });

        res.status(200).json({message: 'Movie added to watchlist'});
    } catch (error){
        console.log('Error adding to watchlist:', error);
        res.status(500).json({message: 'Failed to add movie to watchlist'});
    }
});

app.post('/remove-from-watchlist', async(req, res) => {
    const {id, title, poster} = req.body;
    const authHeader = req.headers.authorization;
    const secretKey = process.env.JWT_SECRET;

    if(!authHeader){
        return res.status(401).json({message: 'Authorization header missing'});
    }
    const token = authHeader.split(' ')[1];
    try{
        const decoded = jwt.verify(token, secretKey);
        const userDoc = doc(firestore, 'users', decoded.username);
        
        await updateDoc(userDoc, {
            watchlist: arrayRemove({id, title, poster}),
        });
        res.status(200).json({message: `Movie removed from watchlist`});
    } catch (error){
        console.error('Error removing from watchlist:', error);
        res.status(500).json({message: 'Failed to remove movie from watchlist'});
    }
});

app.get('/get-watchlist', async (req, res) => {
    const authHeader = req.headers.authorization;
    const secretKey = process.env.JWT_SECRET;

    if(!authHeader){
        return res.status(401).json({message: 'Authorization header missing'});
    }

    const token = authHeader.split(' ')[1];
    try{
        const decoded = jwt.verify(token, secretKey);
        const userDoc = doc(firestore, 'users', decoded.username);
        const snap = await getDoc(userDoc);

        if(!snap.exists()){
            return res.status(404).json({message: 'User not found'});
        }
        const userData = snap.data();
        res.status(200).json({watchlist: userData.watchlist || []});
    } catch (error){
        console.error('Error fetching watchlist:', error);
        res.status(500).json({message: 'Failed to fetch watchlist'});
    }
});