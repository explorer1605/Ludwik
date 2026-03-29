import express from 'express';
import { getLatestTweets } from '../storage/tweetRepository.js';

const router = express.Router();

/**
 * GET /api/tweets/latest
 * Return the latest stored tweets from the database.
 */
router.get('/tweets/latest', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 50;
        const tweets = await getLatestTweets(limit);
        res.status(200).json({ success: true, count: tweets.length, data: tweets });
    } catch (error) {
        console.error("Error in /api/tweets/latest:", error);
        res.status(500).json({ success: false, error: "Failed to fetch latest tweets." });
    }
});

// /**
//  * GET /api/sentiment/summary
//  * Return aggregate sentiment metrics for a selected period.
//  */
// router.get('/sentiment/summary', async (req, res) => {
//     try {
//         const days = req.query.days ? parseInt(req.query.days) : 7;
//         const { data, error } = await getSentimentSummary(days);
//         
//         if (error) throw error;
//         
//         res.status(200).json({ success: true, summary: data });
//     } catch (error) {
//         console.error("Error in /api/sentiment/summary:", error);
//         res.status(500).json({ success: false, error: "Failed to fetch sentiment summary." });
//     }
// });

router.get('/predictions/latest', (req, res) => {
    res.status(501).json({ error: "Not Implemented yet" });
});

export default router;
