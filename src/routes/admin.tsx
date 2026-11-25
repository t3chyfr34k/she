import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { adminLogin, checkAdmin, getSiteContent } from "@/lib/site.functions";
import type { SiteContent } from "@/lib/site-content";

const TOKEN_KEY = "birthday-admin-token";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin · Birthday page" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [token, setToken] = useState("");
  const [content, setContent] = useState<SiteContent | null>(null);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setReady(true);
      return;
    }
    void checkAdmin({ data: { token: stored } })
      .then(async ({ ok }) => {
        if (ok) {
          const site = await getSiteContent({ data: { token: stored } });
          setContent(site.content);
          setToken(stored);
        } else sessionStorage.removeItem(TOKEN_KEY);
      })
      .catch(() => sessionStorage.removeItem(TOKEN_KEY))
      .finally(() => setReady(true));
  }, []);

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await adminLogin({ data: { password } });
      if (!result.ok) {
        setError(
          result.reason === "not-configured"
            ? "Admin access is not configured on this server."
            : "That password wasn’t accepted.",
        );
        return;
      }
      sessionStorage.setItem(TOKEN_KEY, result.token);
      setToken(result.token);
      const site = await getSiteContent({ data: { token: result.token } });
      setContent(site.content);
      setPassword("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not unlock the editor.");
    } finally {
      setBusy(false);
    }
  }

  function lock() {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken("");
    setContent(null);
  }

  if (!ready)
    return (
      <div className="grid min-h-screen place-items-center bg-mint text-forest-deep">
        Checking admin session…
      </div>
    );
  if (token && content)
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto flex max-w-5xl justify-end px-4 pt-4 sm:px-8">
          <button
            onClick={lock}
            className="rounded-lg border px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
          >
            Lock editor
          </button>
        </div>
        <ContentEditor initialContent={content} token={token} />
      </main>
    );

  return (
    <main className="grid min-h-screen place-items-center bg-forest-deep px-4 py-10">
      <form onSubmit={unlock} className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-forest">Private editor</p>
        <h1 className="mt-2 text-2xl font-black text-forest-deep">Unlock admin</h1>
        <label htmlFor="admin-password" className="mt-6 block text-sm font-semibold text-slate-700">
          Password
        </label>
        <input
          id="admin-password"
          autoComplete="current-password"
          type="password"
          required
          maxLength={200}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 w-full rounded-lg border px-3 py-2.5 text-slate-950 outline-none focus:border-forest focus:ring-2 focus:ring-forest/20"
        />
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="mt-5 w-full rounded-lg bg-forest px-4 py-3 font-bold text-white hover:bg-forest-deep disabled:opacity-50"
        >
          {busy ? "Checking…" : "Unlock editor"}
        </button>
        <a href="/" className="mt-4 block text-center text-sm text-slate-600 hover:underline">
          Return to birthday page
        </a>
      </form>
    </main>
  );
}
