// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// Never set ssr.external or resolve.external: the Worker has no runtime module resolution, so
// the build fails. Never add compression (compressPublicAssets, vite-plugin-compression):
// hosting already compresses at the edge.
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";
import { loadEnv } from "vite";
import { fileURLToPath } from "node:url";

const punycodeEntry = fileURLToPath(new URL("./node_modules/punycode/punycode.js", import.meta.url));

// Vite exposes .env values through import.meta.env, but the server-only MongoDB
// code reads process.env. Load these private settings into the Node process too.
const envMode = process.env["NODE_ENV"] === "production" ? "production" : "development";
const isRenderNodeBuild = process.env["RENDER_NODE_SERVER"] === "true";
const localEnv = loadEnv(envMode, process.cwd(), "");
for (const key of ["MONGODB_URI", "ADMIN_PASSWORD", "SESSION_SECRET"]) {
  if (!process.env[key] && localEnv[key]) process.env[key] = localEnv[key];
}

// The dev-only devtools plugin tags every JSX element with data-tsd-source. React Three Fiber
// treats dashed props as nested object paths and crashes, so strip the tag from 3D scene files.
const stripSourceTagsFromThreeScenes = (): Plugin => ({
  name: "strip-tsd-source-from-r3f",
  enforce: "pre",
  apply: "serve",
  transform(code, id) {
    if (!/\/src\/components\/.*Scene\.tsx(\?.*)?$/.test(id) || !code.includes("data-tsd-source")) return;
    return {
      code: code
        .replace(/\s+data-tsd-source=(?:"[^"]*"|\{[^}]*\})/g, "")
        .replace(/,?\s*"data-tsd-source":\s*"[^"]*"/g, ""),
      map: null,
    };
  },
});

export default defineConfig({
  // Use Nitro's Cloudflare module output. Workers' nodejs_compat support covers
  // the MongoDB driver and the server-side crypto APIs used by admin auth.
  nitro: {
    preset: isRenderNodeBuild ? "node-server" : "cloudflare-module",
    // The Node deployment currently hits a circular-import failure between Nitro's
    // split server chunks and the shared CommonJS helper. Keep the Node server in
    // one bundle; leave Cloudflare's module output unchanged.
    ...(isRenderNodeBuild ? { inlineDynamicImports: true } : {}),
    ...(isRenderNodeBuild ? {} : { cloudflare: { nodeCompat: true, deployConfig: true } }),
    // Nitro's Node polyfill otherwise captures tr46's npm `punycode/` import.
    alias: { "punycode/": punycodeEntry },
  } as never,
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [stripSourceTagsFromThreeScenes()],
  },
});
