import 'dotenv/config';
import { runIngestionCycle } from './ingestion/twitterFetcher.js';
import { getActiveHandles } from './storage/tweetRepository.js';
import { runFeatureAggregation } from './features/aggregator.js';

async function manualTestRun() {
    console.log("=== STARTING MANUAL TEST RUN ===");
    
    // 1. Test Ingestion
    try {
        console.log("\n--- Testing Ingestion ---");
        const handles = await getActiveHandles();
        const accountsToFetch = handles.length > 0 ? handles : ['elonmusk'];
        console.log("Accounts to fetch:", accountsToFetch);
        
        await runIngestionCycle(accountsToFetch);
    } catch (err) {
        console.error("Ingestion Test Failed:", err);
    }

    // 2. Test Aggregation (we will see if it successfully pulls empty data or not)
    try {
        console.log("\n--- Testing Feature Aggregation (Yesterday's Data) ---");
        await runFeatureAggregation(); 
    } catch (err) {
        console.error("Aggregation Test Failed:", err);
    }

    console.log("\n=== TEST RUN COMPLETE ===");
    console.log("Note: To test the ML Sentiment Python worker, run `python processing/processing_worker.py` separately.");
    process.exit(0);
}

manualTestRun();
