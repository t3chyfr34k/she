import { useCallback, useEffect, useState } from "react";
import {
  adminDeleteBirthdayWish,
  adminListBirthdayWishes,
  adminUpdateBirthdayWish,
} from "@/lib/site.functions";

type SubmittedWish = {
  id: string;
  name: string;
  message: string;
  photoUrl: string;
  videoUrl: string | null;
  audioUrl: string | null;
  createdAt: string;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-forest-deep/20 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-forest focus:ring-2 focus:ring-forest/20";

export function BirthdayWishManager({ token }: { token: string }) {
  const [wishes, setWishes] = useState<SubmittedWish[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setWishes(await adminListBirthdayWishes({ data: { token } }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load birthday wishes.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function changeWish(id: string, key: "name" | "message", value: string) {
    setWishes((current) =>
      current.map((wish) => (wish.id === id ? { ...wish, [key]: value } : wish)),
    );
  }

  async function saveWish(wish: SubmittedWish) {
    setBusyId(wish.id);
    setError("");
    setNotice("");
    try {
      await adminUpdateBirthdayWish({
        data: { token, id: wish.id, name: wish.name, message: wish.message },
      });
      setNotice(`Saved the wish from ${wish.name}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this wish.");
    } finally {
      setBusyId("");
    }
  }

  async function deleteWish(wish: SubmittedWish) {
    if (
      !window.confirm(
        `Delete the wish from ${wish.name}, including its uploaded photo, audio, and video? This cannot be undone.`,
      )
    )
      return;
    setBusyId(wish.id);
    setError("");
    setNotice("");
    try {
      await adminDeleteBirthdayWish({ data: { token, id: wish.id } });
      setWishes((current) => current.filter((item) => item.id !== wish.id));
      setNotice(`Deleted the wish from ${wish.name} and its uploaded media.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete this wish.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <section className="mb-6 rounded-2xl border bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Submitted birthday wishes</h2>
          <p className="text-sm text-slate-600">
            Edit names and messages, or delete a wish and its uploaded photo/video.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading || !!busyId}
          className="rounded-lg border border-forest-deep/20 px-3 py-2 text-sm font-semibold text-forest-deep hover:bg-mint disabled:opacity-50"
        >
          {loading ? "Loading…" : "Refresh wishes"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-4 rounded-lg bg-mint p-3 text-sm text-forest-deep">
          {notice}
        </p>
      )}
      {loading ? (
        <p className="mt-5 text-sm text-slate-500">Loading wishes…</p>
      ) : wishes.length === 0 ? (
        <p className="mt-5 rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-600">
          No one has submitted a wish yet.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {wishes.map((wish) => (
            <article
              key={wish.id}
              className="grid gap-4 rounded-xl border border-slate-200 p-3 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)] sm:p-4"
            >
              <div>
                <img
                  src={wish.photoUrl}
                  alt={`Photo uploaded by ${wish.name}`}
                  loading="lazy"
                  className="aspect-[4/3] w-full rounded-lg bg-mint object-cover"
                />
                {wish.videoUrl && (
                  <div className="mt-3 flex justify-center">
                    <video
                      src={wish.videoUrl}
                      controls
                      preload="none"
                      playsInline
                      className="h-auto max-h-64 max-w-full w-auto rounded-lg bg-forest object-contain"
                      aria-label={`Video wish from ${wish.name}`}
                    />
                  </div>
                )}
                {wish.audioUrl && (
                  <div className="mt-3">
                    <p className="mb-1 text-xs font-semibold text-slate-600">Voice wish</p>
                    <audio
                      src={wish.audioUrl}
                      controls
                      preload="none"
                      className="w-full"
                      aria-label={`Audio wish from ${wish.name}`}
                    />
                  </div>
                )}
                <time className="mt-2 block text-xs text-slate-500" dateTime={wish.createdAt}>
                  {new Date(wish.createdAt).toLocaleDateString("en", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    timeZone: "UTC",
                  })}
                </time>
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-700">
                  Name
                  <input
                    className={inputClass}
                    maxLength={50}
                    value={wish.name}
                    onChange={(event) => changeWish(wish.id, "name", event.currentTarget.value)}
                  />
                </label>
                <label className="mt-3 block text-xs font-semibold text-slate-700">
                  Birthday wish
                  <textarea
                    className={inputClass}
                    rows={5}
                    maxLength={700}
                    value={wish.message}
                    onChange={(event) => changeWish(wish.id, "message", event.currentTarget.value)}
                  />
                </label>
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    disabled={busyId === wish.id || loading}
                    onClick={() => void deleteWish(wish)}
                    className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-800 hover:bg-red-50 disabled:opacity-50"
                  >
                    {busyId === wish.id ? "Working…" : "Delete wish"}
                  </button>
                  <button
                    type="button"
                    disabled={
                      busyId === wish.id || loading || !wish.name.trim() || !wish.message.trim()
                    }
                    onClick={() => void saveWish(wish)}
                    className="rounded-lg bg-forest px-4 py-2 text-sm font-bold text-white hover:bg-forest-deep disabled:opacity-50"
                  >
                    Save edits
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
