# motivate-bot-worker (API Worker)

This folder is a Cloudflare Worker project (API only).

## Deploy
```bash
cd motivate-bot-worker
npm install
npx wrangler login
npx wrangler deploy
```

## Test
```bash
curl -i "https://<your-worker>.workers.dev/api/motivate"
curl -i -X POST "https://<your-worker>.workers.dev/api/motivate" \
  -H "Content-Type: application/json" \
  -d '{"name":"Asaad","mood":"stressed"}'
```

### Note
The AI binding is configured in `wrangler.toml`:

```toml
[ai]
binding = "AI"
```
