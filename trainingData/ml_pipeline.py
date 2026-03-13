import pandas as pd
import numpy as np
import yfinance as yf
import torch
import joblib
import requests
from lightgbm import LGBMRegressor
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import os
from urllib.parse import quote

# training is not done        -> create     
                    
MODEL_PATH = "gold_model.pkl"
USERNAMES = ["elonmusk", "billgates", "naval"]  # Replace or add more users
# fetch half of the tweets from database and fetch only the latest tweet from twitter-> 

# PREDICT_API = r"C:\Users\Lenovo\Ludwik\frontend"
THRESHOLD = 0.0008

tokenizer = AutoTokenizer.from_pretrained("ProsusAI/finbert")
nlp_model = AutoModelForSequenceClassification.from_pretrained("ProsusAI/finbert")
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
nlp_model.to(device)

# change the interval of training for more data
def fetch_market(period="30d", interval="1d"):
    try:
        gold = yf.download("GC=F", period=period, interval=interval)["Close"]
        dxy = yf.download("DX-Y.NYB", period=period, interval=interval)["Close"]
        vix = yf.download("^VIX", period=period, interval=interval)["Close"]
        us10y = yf.download("^TNX", period=period, interval=interval)["Close"]
        df = pd.concat([gold, dxy, vix, us10y], axis=1)
        df.columns = ["gold","dxy","vix","us10y"]
        return df.dropna()
    except:
        return pd.DataFrame()

def fetch_all_tweets_from_api():
    all_tweets = []
    headers = {"Authorization": "Bearer YOUR_API_KEY"}  # If your API needs auth
    for username in USERNAMES:
        try:
            user_enc = quote(username)
            url = f"https://api.twitterapi.io/twitter/user/last_tweets?userName={user_enc}"
            resp = requests.get(url, headers=headers, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            tweets = [t["text"] for t in data if "text" in t]
            all_tweets.extend(tweets)
        except:
            continue
    print(f"Total tweets fetched from API: {len(all_tweets)}")
    return all_tweets

def get_tweet_sentiment(tweets):
    if not tweets: return 0.0
    nlp_model.eval()
    sentiments = []
    with torch.no_grad():
        for t in tweets:
            inputs = tokenizer(t, return_tensors="pt", truncation=True, padding=True).to(device)
            out = nlp_model(**inputs)
            scores = torch.softmax(out.logits, dim=1)
            sentiments.append((scores[0][2]-scores[0][0]).item())
    return np.mean(sentiments)

def build_features(df):
    if df.empty: return pd.DataFrame()
    df["dxy_return"] = df["dxy"].pct_change()
    window = min(5, len(df)-1)
    df["gold_vol"] = df["gold"].pct_change().rolling(window).std().fillna(0)
    df["real_yield"] = df["us10y"]
    df["risk_off"] = df["vix"]
    tweets = fetch_all_tweets_from_api()
    df["sentiment"] = get_tweet_sentiment(tweets)
    return df.dropna()

def train_model(df):
    if df.empty: return None
    features = ["real_yield","risk_off","dxy_return","gold_vol","sentiment"]
    df["target"] = (df["gold"].shift(-1)-df["gold"])/df["gold"]
    df = df.dropna()
    if df.empty: return None
    X, y = df[features], df["target"]
    model = LGBMRegressor(n_estimators=200, learning_rate=0.05, num_leaves=31)
    model.fit(X, y)
    joblib.dump(model, MODEL_PATH)
    return model

def load_model():
    if os.path.exists(MODEL_PATH):
        return joblib.load(MODEL_PATH)
    return None

def trading_signal_label(pred):
    if pred > THRESHOLD: return "LONG GOLD"
    elif pred < -THRESHOLD: return "SHORT GOLD"
    return "NO TRADE"

def send_prediction(pred, signal):
    if PREDICT_API == "": return
    payload = {"prediction": float(pred), "signal": signal}
    try:
        requests.post(PREDICT_API, json=payload)
    except:
        pass

def predict_live(model):
    market = fetch_market(period="30d", interval="1d")
    if market.empty: return 0.0, "NO TRADE"
    df = build_features(market)
    if df.empty: return 0.0, "NO TRADE"
    X = df.iloc[-1:][["real_yield","risk_off","dxy_return","gold_vol","sentiment"]]
    pred = model.predict(X)[0]
    signal = trading_signal_label(pred)
    send_prediction(pred, signal)
    print(f"Live Prediction: {pred:.5f}, Signal: {signal}")
    return pred, signal

def main():
    market_data = fetch_market(period="30d", interval="1d")
    if market_data.empty: return
    df_features = build_features(market_data)
    model = load_model()
    if model is None:
        model = train_model(df_features)
        if model is None: return
    predict_live(model)

if __name__ == "__main__":
    main()