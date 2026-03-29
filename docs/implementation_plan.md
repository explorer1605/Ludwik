# AI Market Intelligence System - Ingestion Pipeline

This document outlines the plan to build the data ingestion pipeline for the AI Market Intelligence System. The focus of this phase is migrating from a simple script to a robust modular backend structured around a Postgres (Supabase) database.

## Architecture & Modules
- **`storage/`**: Contains the Supabase client connection and helper methods to query/insert to `tweets_raw` and read from `handles` table.
- **`ingestion/`**: Contains the logic to fetch tweets for a set of users, map fields to the DB table, and insert them gracefully (ignoring duplicates).
- **`scheduler/`**: Manages cron jobs (e.g., `node-cron`) to periodically trigger the ingestion module (e.g., every 20 mins).
- **`api/`**: Contains Express routes to expose `/api/tweets/latest` and other endpoints for the frontend.

## Proposed Changes
### Server Setup
#### [MODIFY] server.js
Convert from raw `http` to `express`, configure middleware, port, and connect `api/routes.js`.

### Storage
#### [NEW] storage/supabase.js
Supabase client initialization.
#### [NEW] storage/tweetRepository.js
Methods: `insertRawTweets(tweets)`, `getActiveHandles()`, `getLatestTweets(limit)`.

### Ingestion
#### [NEW] ingestion/twitterFetcher.js
Methods: `fetchUserTweets(username)`, `runIngestionCycle()` (fetches for all handles and stores in DB).

### Scheduler
#### [NEW] scheduler/cron.js
Job to run `runIngestionCycle()` every 20 minutes (`*/20 * * * *`).

### API
#### [NEW] api/routes.js
Basic Express router providing the endpoints requested by the frontend (`GET /api/tweets/latest`).

## Supabase Schema Changes Needed (Manual or initial scripts)
- `tweets_raw`: `tweet_id` (PK), `handle`, `text`, `created_at_source`, `fetched_at`, `raw_json`, `processing_status`.
- `handles`: `handle` (PK), `active`, `priority`, `last_fetched_at`.

## Verification Plan
### Automated Tests
- Review console logs for ingestion job running.
- Unit testing or manual testing of `twitterFetcher.js`.
### Manual Verification
- Start the server, verify Express runs.
- Hit `/api/tweets/latest` via browser or cURL.
- Trigger ingestion manually and check if data lands in the Supabase instance.
