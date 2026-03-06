import 'dotenv/config';
import http from 'http';

const apiKey = process.env.TWITTER_API_KEY;
const port = 3000;

  let cachedTweets = null
  let lastFetchTime = 0
  const usernames = [
    "elonmusk",
    "WarrenBuffett",
    "BillGates",
  ]
 

  const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  
  if(req.method === 'GET' && url.pathname === '/api/last-tweets'){
    const now = Date.now()

    if(cachedTweets && now - lastFetchTime < 60000){
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify(cachedTweets));
      return;
    }
    try {
      const results = []
      for(const username of usernames){
        console.log("Fetching: ", username);

        const upstream = await fetch(`https://api.twitterapi.io/twitter/user/last_tweets?userName=${encodeURIComponent(username)}`, {
        headers: { 'X-API-Key': apiKey }
      });

      if(!upstream.ok){
        const errorMessage = await upstream.text()
         console.log("Upstream blocked: ", username, upstream.status);
         console.log("Error Response:", errorMessage);
         continue;
      }
       
        const data = await upstream.json();
        const tweet = data?.data?.tweets?.[0];

        if(tweet) results.push(tweet);
        await new Promise(res => setTimeout(res, 5500))
      }
      cachedTweets = results
      lastFetchTime = now

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      })
      res.end(JSON.stringify(results))

    } catch (err) {
      res.writeHead(500, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }
  res.writeHead(404, { 'Access-Control-Allow-Origin': '*' });
  res.end();
});

server.listen(port, () => console.log(`Server running on http://localhost:${port}`));
