import 'dotenv/config';
import { insertRawTweets, updateHandleFetchTime } from '../storage/tweetRepository.js';

const apiKey = process.env.TWITTER_API_KEY;

/**
 * Fetches the latest tweets for a specific user.
 */
export async function fetchUserTweets(username) {
    console.log(`[Ingestion] Fetching tweets for user: ${username}`);
    
    try {
        const url = `https://api.twitterapi.io/twitter/user/last_tweets?userName=${encodeURIComponent(username)}`;
        const response = await fetch(url, {
            headers: { 'X-API-Key': apiKey }
        });

        if (!response.ok) {
            const errorMsg = await response.text();
            console.error(`[Ingestion] Failed pushing for ${username}: ${response.status}`, errorMsg);
            return [];
        }

        const data = await response.json();
        const tweets = data?.data?.tweets || [];
        
        console.log(`[Ingestion] Successfully fetched ${tweets.length} tweets for ${username}`);
        return tweets;
    } catch (error) {
        console.error(`[Ingestion] Exception while fetching for ${username}:`, error.message);
        return [];
    }
}

/**
 * Runs the complete ingestion cycle for a given list of handles.
 */
export async function runIngestionCycle(handles) {
    if (!handles || handles.length === 0) {
        console.log("[Ingestion] No handles provided for ingestion cycle.");
        return { totalInserted: 0 };
    }

    console.log(`[Ingestion] Starting ingestion cycle for ${handles.length} handles...`);
    
    let totalInserted = 0;
    
    for (const username of handles) {
        const tweets = await fetchUserTweets(username);
        
        if (tweets.length > 0) {
            const { count, error } = await insertRawTweets(tweets);
            if (!error) {
                totalInserted += count;
                await updateHandleFetchTime(username);
            }
        }
        
        // Wait 5 seconds between users to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    console.log(`[Ingestion] Cycle complete. Inserted/Upserted ${totalInserted} raw tweets.`);
    return { totalInserted };
}

export async function historicTweet(handles){
    for(handle in handles){
        
    }
}
