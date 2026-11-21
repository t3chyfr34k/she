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

This app can also be built as Nitro's Node server for Render. Set the Render build command to `RENDER_NODE_SERVER=true npm run build` and the start command to `node .output/server/index.mjs`. Set `HOST=0.0.0.0`; Nitro reads Render's assigned `PORT` automatically. Configure the existing MongoDB and admin secrets in Render's environment settings as usual.

Render or an external uptime monitor can request `GET /health`. A healthy response is JSON with `status`, process `uptime` in seconds, and an ISO 8601 `timestamp`. The Node server runtime manages termination signals and graceful shutdown.
