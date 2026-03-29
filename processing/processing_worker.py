import os
import requests
import torch
import numpy as np
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from dotenv import load_dotenv

# Load ENV
load_dotenv(dotenv_path="../.env")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("WARNING: SUPABASE_URL or SUPABASE_KEY missing from environment variables.")

# Setup Supabase REST headers
req_headers = {
    "apikey": SUPABASE_KEY or "",
    "Authorization": f"Bearer {SUPABASE_KEY or ''}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# Initialize FinBERT Model (duplicated from ML engineer's pipeline)
print("[Processing Worker] Initializing FinBERT...")
tokenizer = AutoTokenizer.from_pretrained("ProsusAI/finbert")
nlp_model = AutoModelForSequenceClassification.from_pretrained("ProsusAI/finbert")
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
nlp_model.to(device)
print(f"[Processing Worker] Model loaded on {device}")

def get_single_tweet_sentiment(text):
    """Runs finbert inference on a single string, returning the float score."""
    if not text: 
        return 0.0
    nlp_model.eval()
    with torch.no_grad():
        inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True).to(device)
        out = nlp_model(**inputs)
        scores = torch.softmax(out.logits, dim=1)
        # Score computation taken directly from ml_pipeline.py
        sentiment = (scores[0][2] - scores[0][0]).item()
    return float(sentiment)

def fetch_pending_tweets():
    """Reads tweets from Supabase where processing_status = pending."""
    try:
        url = f"{SUPABASE_URL}/rest/v1/tweets_raw?processing_status=eq.pending"
        resp = requests.get(url, headers=req_headers)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print("[Processing Worker] Error fetching pending tweets:", e)
        return []

def upsert_sentiments_and_mark_processed(sentiment_rows, tweet_ids):
    """Upserts into tweet_sentiment and patches tweets_raw."""
    try:
        # Upsert sentiments
        sentiment_url = f"{SUPABASE_URL}/rest/v1/tweet_sentiment"
        # We need UPSERT preference so it handles conflicts gracefully
        upsert_headers = {**req_headers, "Prefer": "resolution=merge-duplicates"}
        post_resp = requests.post(sentiment_url, headers=upsert_headers, json=sentiment_rows)
        post_resp.raise_for_status()

        # Mark raw tweets as processed
        # Construct an 'in' filter for the PATCH logic: ?tweet_id=in.(id1,id2,id3)
        ids_str = ",".join(tweet_ids)
        update_url = f"{SUPABASE_URL}/rest/v1/tweets_raw?tweet_id=in.({ids_str})"
        patch_resp = requests.patch(update_url, headers=req_headers, json={"processing_status": "processed"})
        patch_resp.raise_for_status()
        
        return True
    except Exception as e:
        print("[Processing Worker] Error saving database records:", e)
        return False

def main():
    print("[Processing Worker] Starting cycle...")
    tweets = fetch_pending_tweets()
    
    if not tweets:
        print("[Processing Worker] No pending tweets. Exiting.")
        return

    print(f"[Processing Worker] Found {len(tweets)} pending tweets. Computing sentiment...")

    sentiment_rows = []
    tweet_ids = []

    for t in tweets:
        tweet_id = t.get("tweet_id")
        text = t.get("text")
        
        score = get_single_tweet_sentiment(text)
        
        sentiment_rows.append({
            "tweet_id": tweet_id,
            "sentiment_score": score,
            "model_version": "finbert-python-v1"
        })
        tweet_ids.append(tweet_id)
        
    print("[Processing Worker] Scoring complete. Updating database...")
    success = upsert_sentiments_and_mark_processed(sentiment_rows, tweet_ids)

    if success:
        print(f"[Processing Worker] Successfully processed {len(tweets)} tweets.")
    else:
        print("[Processing Worker] Processing finished but DB update failed.")

if __name__ == "__main__":
    main()
