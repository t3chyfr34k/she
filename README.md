# Emerald Birthday Reel

https://www.landing.love/sites/sweet-tape/ recreate this , as a birthday site , smooth 3d and smooth animations , wth light emerald green theme and color pallete matchig

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ebd9ffda-f9df-4466-9b86-67309fdeb8ea).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## MongoDB

The site reads its content from MongoDB's `site_content` collection and stores uploaded images in `photos`. On the first successful page load, it creates the default site content document; later reads use that saved document. Admin save and photo upload server functions write changes back to MongoDB.

Set `MONGODB_URI`, `ADMIN_PASSWORD`, and `SESSION_SECRET` in your local environment or deployment secrets. Copy `.env.example` to `.env` for local work and replace each placeholder with your own values. Keep `.env` and production credentials out of source control.

## Deploy to Cloudflare Workers

The production build uses Nitro's Cloudflare module preset, with Node.js compatibility enabled for the MongoDB driver and server-side authentication. `wrangler.jsonc` points Wrangler at the generated Worker and static assets.

1. Install dependencies with `npm install`.
2. Authenticate with `npx wrangler login`.
3. Add these production secrets to the Worker (enter each value when prompted; do not commit them):

   ```sh
   npx wrangler secret put MONGODB_URI
   npx wrangler secret put ADMIN_PASSW

4. Deploy with `npm run deploy` (builds first), or run `npm run build` followed by `npx wrangler deploy`.

For local Cloudflare-runtime preview, run `npm run build` and then `npm run preview`. Uploaded photos, background video, and the birthday MP3 continue to use MongoDB. Ensure the MongoDB cluster's network access allows connections from the Worker; restrict access with your Cloudflare deployment's available egress controls where possible.

## Deploy to Render

This app includes a Render Blueprint in `render.yaml`. Create a Blueprint from this repository to use the Node runtime, Render's assigned `PORT`, the production Node build, and `node .output/server/index.mjs` as the start command. The build command installs dev dependencies because Vite's config depends on one: `npm ci --include=dev && RENDER_NODE_SERVER=true npm run build`. The Blueprint configures `/health` as Render's HTTP health check. Enter `MONGODB_URI` and `ADMIN_PASSWORD` in Render when prompted; `SESSION_SECRET` is generated for the service.

`GET /health` returns JSON with `status`, process `uptime` in seconds, and an ISO 8601 `timestamp`. The endpoint is a lightweight health check and does not connect to MongoDB. Render uses health checks to confirm an instance is serving and restart it if unhealthy. Free web services can still spin down after 15 minutes without inbound traffic; use an external uptime monitor that requests `/health` periodically or choose a paid plan if the service must stay continuously running. The Node server runtime manages termination signals and graceful shutdown.
