import 'dotenv/config';
import http from 'http';
// import { history,goldCurrentPrice} from 'goldApi.js'
const apiKey = process.env.TWITTER_API_KEY;
const port = 3000;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/api/last-tweets') {
    const username = url.searchParams.get('username');

    if (!username) {
      res.writeHead(400, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ error: 'username is required' }));
      return;
    }

    try {
      const upstream = await fetch(`https://api.twitterapi.io/twitter/user/last_tweets?userName=${encodeURIComponent(username)}`, {
        headers: { 'X-API-Key': apiKey }
      });

      const body = await upstream.text();
      res.writeHead(upstream.status, {
        'Content-Type': upstream.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(body);
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
