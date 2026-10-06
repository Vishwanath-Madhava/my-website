# AI Chatbot — Website

A standalone marketing site **and** working interactive demo for the `ai-chatbot`
project (the Python/FastAPI assistant that searches YouTube, reads & sends Gmail,
and posts to Telegram / Slack / Discord).

No build step, no dependencies — just open `index.html`.

## Files

| File | Purpose |
|---|---|
| `index.html` | Full page: hero, live demo, features, tools, architecture, quick start, API reference |
| `styles.css` | Dark theme, responsive layout, animations |
| `app.js` | Nav, copy buttons, hero chat animation, and the demo agent |

## Run it

```bash
# simplest — just open the file
open index.html            # macOS
xdg-open index.html        # Linux

# or serve it (recommended, so fetch() works cleanly)
python -m http.server 5500
# → http://127.0.0.1:5500
```

## The demo has two modes

1. **Simulated** (default) — a client-side agent that mimics the real tool-calling
   flow. It recognises YouTube / email / Slack / Telegram / Discord intents and
   renders the `🔧 tool(args)` calls before the reply. No keys required.
2. **Live backend** — enter the base URL of the running FastAPI app
   (e.g. `http://127.0.0.1:8000`) and the page will `POST /api/chat` and
   `POST /api/reset` exactly like the built-in UI does.

To use live mode, start the backend first:

```bash
cd ../ai-chatbot
pip install -r requirements.txt
cp .env.example .env      # set CHATBOT_MODEL + LLM_API_KEY
python app.py             # → http://127.0.0.1:8000
```

> If the page is served from a different origin than the API, enable CORS on the
> FastAPI app (`fastapi.middleware.cors.CORSMiddleware`) or serve this site from
> the same host.

## Deploy

It's static — drop the three files on any host (GitHub Pages, Netlify, Vercel,
S3, nginx). Nothing to compile.
