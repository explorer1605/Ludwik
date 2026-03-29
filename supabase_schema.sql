-- Supabase Schema Setup for AI Market Intelligence System

-- 1. tweets_raw table
CREATE TABLE IF NOT EXISTS tweets_raw (
    tweet_id TEXT PRIMARY KEY,
    handle TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at_source TIMESTAMPTZ NOT NULL,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    raw_json JSONB,
    processing_status TEXT DEFAULT 'pending'
);

-- 2. handles table (Accounts to fetch from)
CREATE TABLE IF NOT EXISTS handles (
    handle TEXT PRIMARY KEY,
    active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 1,
    last_fetched_at TIMESTAMPTZ
);

-- Seed initial handles config based on server.js
INSERT INTO handles (handle, active) VALUES
    ('elonmusk', true),
    ('WarrenBuffett', true),
    ('BillGates', true),
    ('Reuters', true)
ON CONFLICT (handle) DO NOTHING;

-- 3. tweet_sentiment table (Simplified based on Python ML pipeline)
CREATE TABLE IF NOT EXISTS tweet_sentiment (
    tweet_id TEXT PRIMARY KEY REFERENCES tweets_raw(tweet_id),
    sentiment_score REAL,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    model_version TEXT
);

-- 4. gold_prices table
CREATE TABLE IF NOT EXISTS gold_prices (
    timestamp TIMESTAMPTZ PRIMARY KEY,
    high REAL,
    volume BIGINT,
    open REAL,
    low REAL,
    close REAL,
    adjClose REAL
);

-- 5. daily_feature_rows table (Added columns matching ML features)
CREATE TABLE IF NOT EXISTS daily_feature_rows (
    feature_date DATE PRIMARY KEY,
    tweet_count INTEGER,
    gold_price_today REAL,
    real_yield REAL,
    risk_off REAL,
    dxy_return REAL,
    gold_vol REAL,
    sentiment REAL,
    future_price_labels JSONB,
    feature_version TEXT
);

CREATE TABLE IF NOT EXISTS predictions (
    prediction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_date DATE,
    horizon_days INTEGER,
    predicted_value REAL,
    confidence REAL,
    model_version TEXT,
    feature_row_id DATE REFERENCES daily_feature_rows(feature_date),
    actual_value REAL,
    error_value REAL,
    status TEXT
);

CREATE TABLE IF NOT EXISTS model_runs (
    model_version TEXT PRIMARY KEY,
    trained_at TIMESTAMPTZ DEFAULT NOW(),
    data_start_date DATE,
    data_end_date DATE,
    metrics_json JSONB,
    artifact_path TEXT
);
