# Motivation Bot (Frontend + AI Worker)

## Frontend (static)
- Files are in `frontend/`
- Deploy to Cloudflare Pages (Framework: None, Root directory: `frontend`)

## AI Backend (Cloudflare Worker + Workers AI)
- Worker source is in `worker/`
- Deploy with Wrangler:

```bash
cd worker
npm install
npx wrangler login
npx wrangler deploy --name motivate-bot
```

Your frontend (`frontend/app.js`) calls:
`https://motivate-bot.ayehtetheinmessi.workers.dev/api/motivate`
