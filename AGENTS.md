<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- The birthday page is composed in `src/routes/index.tsx` from section components in `src/components/birthday/`; keep each section self-contained so sections can be reordered.
- three.js scenes (`HeroScene`, `BalloonScene`) are lazy-loaded behind `<ClientOnly>`; never import them statically, because SSR cannot evaluate WebGL code.
- three.js material colors are hex constants mirroring the CSS tokens in `src/styles.css`; update both together when the palette changes.
- The recipient's name comes from the `?to=` search param, so one deploy can be shared with anyone.
- `vite.config.ts` strips the dev-only `data-tsd-source` tags from `src/components/**/*Scene.tsx`, because React Three Fiber crashes on dashed props; name any new 3D scene file `*Scene.tsx`.
