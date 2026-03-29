# AI Market Intelligence System - Ingestion Pipeline Task List

## 1. Project Setup
- [x] Initialize Express app and reorganize folder structure (`ingestion/`, `scheduler/`, `api/`, `storage/`, etc.)
- [x] Install dependencies (`express`, `@supabase/supabase-js`, `node-cron`, `axios`)
- [x] Set up environment variables for Supabase and Twitter API

## 2. Storage Setup (Database)
- [x] Create `storage/supabaseClient.js` for DB connection
- [x] Document the schema specifically for `tweets_raw` and `handles`
- [x] Add DB operations for inserting tweets idempotently and fetching handles

## 3. Ingestion Module
- [x] Create `ingestion/twitterFetcher.js` to handle API calls to Twitter or existing API
- [x] Create logic to parse tweets and map to the `tweets_raw` schema
- [x] Store raw tweets into Supabase using the database methods

## 4. Scheduler Module
- [x] Create `scheduler/index.js` setup using `node-cron`
- [x] Define `fetch_tweets_job` to run every 20 minutes
- [x] Add the integration between the scheduler and the ingestion module

## 5. API Endpoints
- [x] Setup `api/routes.js` to expose frontend REST routes
- [x] Implement `GET /api/tweets/latest`
- [x] Hook up existing server to use the new express API

## 6. Processing Database Setup
## 6. Schema and Clean Up
- [x] Remove Node-based `sentiment` logic and unused functions.
- [x] Simplify `tweet_sentiment` schema in `supabase_schema.sql`.
- [x] Add ML feature columns to `daily_feature_rows` in `supabase_schema.sql`.

## 7. Python Processing Worker
- [x] Create `processing/processing_worker.py` to handle ML execution.
- [x] Connect `processing_worker.py` to Supabase via API/SDK.
- [x] Copy finbert inference logic from `ml_pipeline.py`.
- [x] Implement query logic to select `pending` tweets, score them, and upsert back to Supabase.

## 8. Feature Aggregation Module
- [x] Create `features/aggregator.js` to build daily rows.
- [x] Implement strict `YYYY-MM-DD` date parsing to prevent timezone mismatches.
- [x] Add `aggregate_features_job` to the scheduler to run daily after market close.
