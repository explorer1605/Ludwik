import 'dotenv/config';
import express from 'express';
// import { history, goldCurrentPrice } from 'goldApi.js'
import apiRoutes from './api/routes.js';
import { initJobs } from './scheduler/index.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Enable CORS for frontend integration
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Health check and root route
app.get('/', (req, res) => {
    res.send({ status: 'ok', message: 'AI Market Intelligence System API' });
});

// Hook up the new REST routes
app.use('/api', apiRoutes);

// Fallback legacy proxy route if TwitterApi.js still needs it directly 
import { fetchUserTweets } from './ingestion/twitterFetcher.js';
app.get('/api/last-tweets', async (req, res) => {
    try {
        const username = req.query.username || 'elonmusk';
        const tweets = await fetchUserTweets(username);
        res.json({ data: { tweets } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Initialize Cron Jobs
initJobs();

app.listen(port, () => {
    console.log(`[Server] running on http://localhost:${port}`);
});
