import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Check, ImagePlus, Send, Video } from "lucide-react";

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

export const Route = createFileRoute("/wishes")({
  head: () => ({
    meta: [
      { title: "Birthday wishes · Happy Birthday" },
      {
        name: "description",
        content: "Leave a birthday wish, add your photo, and optionally share a video message.",
      },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  component: WishesPage,
});

function WishesPage() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!photo) {
      setPhotoPreview("");
      return;
    }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setError("");
    setSuccess(false);
    try {
      const form = new FormData(formElement);
      const response = await fetch("/api/public/wishes", { method: "POST", body: form });
      const result = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(result.error ?? "Your wish could not be sent. Please try again.");
      formElement.reset();
      setPhoto(null);
      setVideo(null);
      setSuccess(true);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Your wish could not be sent. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-mint px-4 py-8 text-forest sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mx-auto mb-10 mt-10 max-w-2xl text-center">
          <p className="label-chip text-sm tracking-[.22em] text-jade">A little love from you</p>
          <h1 className="text-display mt-4 text-6xl sm:text-8xl">Leave a wish</h1>
          <p className="mt-5 text-lg sm:text-xl">
            Write a birthday message, add your photo, and send a video greeting if you like.
          </p>
        </header>

        <div className="mx-auto max-w-2xl">
          <form
            onSubmit={submit}
            className="rounded-3xl border border-forest/10 bg-cream p-5 shadow-lift sm:p-8"
          >
            <label className="label-chip block text-sm" htmlFor="wish-name">
              Your name <span aria-hidden="true">*</span>
            </label>
            <input
              id="wish-name"
              name="name"
              required
              maxLength={50}
              autoComplete="name"
              placeholder="What should we call you?"
              className="mt-2 w-full rounded-xl border border-forest/20 bg-white px-4 py-3 text-base outline-none transition focus:border-jade focus:ring-2 focus:ring-jade/20"
            />

            <label className="label-chip mt-5 block text-sm" htmlFor="wish-message">
              Your birthday wish <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="wish-message"
              name="message"
              required
              maxLength={700}
              rows={5}
              placeholder="Write something from the heart…"
              className="mt-2 w-full resize-y rounded-xl border border-forest/20 bg-white px-4 py-3 text-base leading-relaxed outline-none transition focus:border-jade focus:ring-2 focus:ring-jade/20"
            />

            <label className="label-chip mt-5 block text-sm" htmlFor="wish-photo">
              Your photo <span aria-hidden="true">*</span>
            </label>
            <div className="mt-2 flex items-center gap-4 rounded-xl border border-dashed border-forest/30 bg-white p-3">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Preview of your selected photo"
                  className="h-20 w-20 rounded-lg object-cover"
                />
              ) : (
                <span className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-mint text-jade">
                  <ImagePlus className="h-8 w-8" aria-hidden="true" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <input
                  id="wish-photo"
                  name="photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  required
                  onChange={(event) => {
                    const selected = event.currentTarget.files?.[0] ?? null;
                    if (selected && selected.size > MAX_PHOTO_BYTES) {
                      event.currentTarget.value = "";
                      setPhoto(null);
                      setError("Your photo must be 8 MB or smaller.");
                      return;
                    }
                    setPhoto(selected);
                    setError("");
                  }}
                  className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-forest file:px-4 file:py-2 file:font-bold file:text-cream"
                />
                <p className="mt-1 text-xs text-forest/65">JPG, PNG or WebP · up to 8 MB</p>
              </div>
            </div>

            <label className="label-chip mt-5 block text-sm" htmlFor="wish-video">
              Video greeting{" "}
              <span className="font-normal normal-case tracking-normal text-forest/60">
                (optional)
              </span>
            </label>
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-forest/15 bg-white p-3">
              <Video className="h-6 w-6 shrink-0 text-jade" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <input
                  id="wish-video"
                  name="video"
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={(event) => {
                    const selected = event.currentTarget.files?.[0] ?? null;
                    if (selected && selected.size > MAX_VIDEO_BYTES) {
                      event.currentTarget.value = "";
                      setVideo(null);
                      setError("Your video must be 25 MB or smaller.");
                      return;
                    }
                    setVideo(selected);
                    setError("");
                  }}
                  className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-mint file:px-4 file:py-2 file:font-bold file:text-forest"
                />
                <p className="mt-1 truncate text-xs text-forest/65">
                  {video
                    ? `${video.name} · ${(video.size / (1024 * 1024)).toFixed(1)} MB`
                    : "MP4 or WebM · up to 25 MB"}
                </p>
              </div>
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl bg-mint/70 p-3 text-sm leading-relaxed">
              <input
                name="consent"
                type="checkbox"
                value="yes"
                required
                className="mt-1 accent-jade"
              />
              <span>
                I’m happy for my name, wish, photo, and optional video to appear on this public
                birthday page.
              </span>
            </label>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800"
              >
                {error}
              </p>
            )}
            {success && (
              <p
                role="status"
                className="mt-4 flex items-center gap-2 rounded-xl bg-jade/10 p-3 text-sm font-bold text-forest"
              >
                <Check className="h-5 w-5" aria-hidden="true" />
                Your wish is on the birthday page. Thank you!
              </p>
            )}
            <button
              type="submit"
              disabled={busy || !photo}
              className="label-chip mt-5 inline-flex w-full items-center justify-center gap-3 rounded-full bg-gold px-6 py-4 text-lg text-forest shadow-sticker transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
            >
              {busy ? "Sending your wish…" : "Send birthday wish"}
              <Send className="h-5 w-5" aria-hidden="true" />
            </button>
            <p className="mt-3 text-center text-xs text-forest/60">
              Your photo is required. Video is optional.
            </p>
          </form>
          <p className="mt-5 text-center text-sm text-forest/70">
            Your message will be saved for the birthday celebration. Thank you for being part of it!{" "}
            <span aria-hidden="true">♥</span>
          </p>
        </div>
      </div>
    </main>
  );
}
