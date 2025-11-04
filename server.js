require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GOOGLE_API_KEY || '';

app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'pages')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/css', express.static(path.join(__dirname, 'css')));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/check', async (req, res) => {
  const raw = (req.query.url || '').trim();
  if (!raw) return res.status(400).json({ error: 'missing url' });

  const url = raw.startsWith('http') ? raw : 'http://' + raw;

  if (!API_KEY) return res.status(500).json({ error: 'server misconfigured: set GOOGLE_API_KEY' });

  const body = {
    client: { clientId: "strengthify", clientVersion: "1.0" },
    threatInfo: {
      threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url }]
    }
  };

  try {
    const r = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    let safeBrowsingJson = {};
    if (r.ok) safeBrowsingJson = await r.json();
    else {
      const text = await r.text();
      return res.status(502).json({ error: 'Google API error', status: r.status, body: text });
    }

    // Check if site is online
    let online = true;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
      online = response.ok;
      clearTimeout(timeout);
    } catch {
      online = false;
    }

    return res.json({
      safe: !(safeBrowsingJson.matches && safeBrowsingJson.matches.length),
      matches: safeBrowsingJson.matches || [],
      online
    });

  } catch (err) {
    return res.status(500).json({ error: 'fetch_failed', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});