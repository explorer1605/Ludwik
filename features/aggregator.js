import { supabase } from '../storage/supabaseClient.js';

/**
 * Strips timezone details to strictly return a UTC YYYY-MM-DD date string.
 * This aligns Twitter UTC output with Yahoo Finance daily bars.
 */
function getStrictDateString(dateObj) {
    const year = dateObj.getUTCFullYear();
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Aggregates all tweet sentiments for a given date and upserts the result.
 * @param {Date} targetDate - The day to aggregate (defaults to yesterday if not provided)
 */
export async function runFeatureAggregation(targetDate = null) {
    console.log("[Aggregator] Starting daily feature aggregation cycle...");
    
    // Default to the previous fully-closed trading day
    if (!targetDate) {
        targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - 1);
    }
    
    const dateStr = getStrictDateString(targetDate);
    
    // 1. Fetch all processed tweet sentiments for this specific date string
    // By creating start and end bounds
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`).toISOString();
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`).toISOString();

    const { data: sentiments, error: fetchError } = await supabase
        .from('tweet_sentiment')
        .select('sentiment_score')
        .gte('processed_at', startOfDay)
        .lte('processed_at', endOfDay);

    if (fetchError) {
        console.error(`[Aggregator] Failed to fetch sentiments for ${dateStr}:`, fetchError);
        return { success: false };
    }

    if (!sentiments || sentiments.length === 0) {
        console.log(`[Aggregator] No sentiments processed for ${dateStr}. Skipping feature row update.`);
        return { success: true, count: 0 };
    }

    // 2. Average the sentiments
    const totalScore = sentiments.reduce((acc, current) => acc + (current.sentiment_score || 0), 0);
    const meanSentiment = totalScore / sentiments.length;
    
    console.log(`[Aggregator] Daily Sentiment for ${dateStr}: ${meanSentiment.toFixed(5)} (based on ${sentiments.length} tweets).`);

    // 3. Upsert into daily_feature_rows, leaving the Yahoo Finance columns intact
    const { error: upsertError } = await supabase
        .from('daily_feature_rows')
        .upsert({
            feature_date: dateStr,
            tweet_count: sentiments.length,
            sentiment: meanSentiment
        }, {
            onConflict: 'feature_date',
            // We do a merge upsert so we don't accidentally blank out the ML features 
            // (real_yield, risk_off, etc.) if they were already written by Yahoo Finance.
            ignoreDuplicates: false
        });

    if (upsertError) {
        console.error(`[Aggregator] Failed to upsert feature row for ${dateStr}:`, upsertError);
        return { success: false };
    }
    
    console.log(`[Aggregator] Successfully saved feature row for ${dateStr}.`);
    return { success: true, count: sentiments.length };
}
