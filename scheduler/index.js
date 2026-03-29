import cron from 'node-cron';
import { runIngestionCycle } from '../ingestion/twitterFetcher.js';
import { getActiveHandles } from '../storage/tweetRepository.js';

let isFetching = false;

import { runFeatureAggregation } from '../features/aggregator.js';

let isAggregating = false;

export function initJobs() {
    console.log("[Scheduler] Initializing cron jobs...");

    // Run based on environment variable, or default to every 20 minutes
    const scheduleTiming = process.env.CRON_SCHEDULE || '*/20 * * * *';
    cron.schedule(scheduleTiming, async () => {
        if (isFetching) {
            console.log("[Scheduler] Previous fetch job is still running, skipping this tick.");
            return;
        }

        console.log("[Scheduler] Triggering scheduled fetch_tweets_job...");
        isFetching = true;

        try {
            // First fetch active handles from the database
            const handles = await getActiveHandles();

            // If DB is not reachable or empty, fallback to default accounts
            //only test from DB accounts.Add this hardcodedFallback to DB.
            const hardcodedFallback = ['elonmusk', 'WarrenBuffett', 'BillGates', 'Reuters'];
            const accountsToFetch = handles.length > 0 ? handles : hardcodedFallback;

            await runIngestionCycle(accountsToFetch);
        } catch (error) {
            console.error("[Scheduler] Error in fetch_tweets_job:", error);
        } finally {
            isFetching = false;
        }
    });

    console.log("[Scheduler] Job: fetch_tweets_job scheduled successfully (Every 20m).");
    
    // Aggregation job runs daily at 18:00 EST / 23:00 UTC (after market close)
    cron.schedule('0 23 * * *', async () => {
        if (isAggregating) return;
        console.log("[Scheduler] Triggering daily feature aggregation job...");
        isAggregating = true;
        
        try {
            await runFeatureAggregation(); // defaults to today/yesterday UTC bounds
        } catch (error) {
            console.error("[Scheduler] Error in aggregate_features_job:", error);
        } finally {
            isAggregating = false;
        }
    });
    
    console.log("[Scheduler] Job: aggregate_features_job scheduled successfully (Daily at 23:00 UTC).");
}
