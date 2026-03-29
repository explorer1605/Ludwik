import { supabase } from './supabaseClient.js';

/**
 * Inserts raw tweets into the database, ignoring duplicates.
 */
export async function insertRawTweets(tweets) {
    if (!tweets || tweets.length === 0) return { error: null, count: 0 };

    // Map array of tweet objects to schema
    const formattedTweets = tweets.map(t => ({
        tweet_id: t.id,
        handle: t.author?.userName || 'unknown',
        text: t.text,
        created_at_source: t.createdAt,
        raw_json: t
    }));

    const { data, error } = await supabase
        .from('tweets_raw')
        .upsert(formattedTweets, { onConflict: 'tweet_id', ignoreDuplicates: true });

    if (error) {
        console.error("Error inserting tweets:", error);
    }

    return { data, error, count: formattedTweets.length };
}

/**
 * Gets a list of handles that are marked active.
 */
export async function getActiveHandles() {
    const { data, error } = await supabase
        .from('handles')
        .select('handle')
        .eq('active', true)
        .order('priority', { ascending: false });

    if (error) {
        console.error("Error fetching handles:", error);
        return [];
    }

    return data.map(row => row.handle);
}

/**
 * Updates the last_fetched_at timestamp for a handle.
 */
export async function updateHandleFetchTime(handle) {
    const { error } = await supabase
        .from('handles')
        .update({ last_fetched_at: new Date().toISOString() })
        .eq('handle', handle);

    if (error) {
        console.error(`Error updating fetch time for ${handle}:`, error);
    }
}

/**
 * Gets the latest tweets for the UI.
 */
export async function getLatestTweets(limit = 20) {
    const { data, error } = await supabase
        .from('tweets_raw')
        .select('*')
        .order('created_at_source', { ascending: false })
        .limit(limit);

    if (error) {
        throw error;
    }
    return data;
}

/**
 * Gets a batch of unprocessed tweets from the database.
 */
export async function getUnprocessedTweets(limit = 100) {
    const { data, error } = await supabase
        .from('tweets_raw')
        .select('*')
        .eq('processing_status', 'pending')
        .order('created_at_source', { ascending: true })
        .limit(limit);

    if (error) {
        console.error("Error fetching unprocessed tweets:", error);
        return [];
    }
    return data;
}

/**
 * Saves processed sentiment data into tweet_sentiment table.
 */
export async function saveTweetSentiment(sentimentRows) {
    if (!sentimentRows || sentimentRows.length === 0) return { error: null };

    const { error } = await supabase
        .from('tweet_sentiment')
        .upsert(sentimentRows, { onConflict: 'tweet_id' });

    if (error) {
        console.error("Error saving sentiment rows:", error);
    }
    return { error };
}

/**
 * Updates the processing_status of raw tweets after successful sentiment analysis.
 */
export async function markTweetsAsProcessed(tweetIds) {
    if (!tweetIds || tweetIds.length === 0) return { error: null };

    // Using an IN query to update multiple rows in one operation
    const { error } = await supabase
        .from('tweets_raw')
        .update({ processing_status: 'processed' })
        .in('tweet_id', tweetIds);

    if (error) {
        console.error("Error marking tweets as processed:", error);
    }
    return { error };
}

// export async function getSentimentSummary(days = 7) {
//     // What is this function doing? I already have made a sentiment analyzer in /trainingData folder. 
//     // Use that to get table fields and sentiments.
// }


//Batch updating function for raw tweets database for training data

export async function HistoricRawTweetupdating(){

    fetch('../ingestion/returesBiz_2007to2010.json')
    .then((result)=>{
        result.json();
    })
    .then((data)=>{
        console.log( `fetched object succesfully`);
        //JS object
        for(entries in data.instructions){
        for(tweet in entries){
        const formattedTweets={
            timestamp:tweet.content.tweet_results.legacy.created_at,
            content:tweet.content.tweet_results.legacy.full_text,
            tweet_id_str:tweet.content.tweet_results.legacy.conversation_id_str,
            handle:tweet.content.tweet_results.result.core.user_results.result.core.screen_name

        }
        
    const { data, error } = await supabase
        .from('tweets_raw')
        .upsert(formattedTweets, { onConflict: 'tweet_id', ignoreDuplicates: true });

    if (error) {
        console.error("Error inserting tweets:", error);
    }

    return { data, error, count: formattedTweets.length };
    }
    }
    })
}