import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AudioLines, Check, ImagePlus, Mic, Send, Square, Video } from "lucide-react";

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

export const Route = createFileRoute("/wishes")({
  head: () => ({
    meta: [
      { title: "Birthday wishes · Happy Birthday" },
      {
        name: "description",
        content:
          "Leave Deekshi a birthday wish with your photo and an optional audio or video greeting.",
      },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  component: WishesPage,
});

function WishesPage() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [audio, setAudio] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [audioPreview, setAudioPreview] = useState("");
  const [recordingStarting, setRecordingStarting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const recorderFailedRef = useRef(false);
  const recorderTooLargeRef = useRef(false);

  useEffect(() => {
    if (!photo) {
      setPhotoPreview("");
      return;
    }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  useEffect(() => {
    if (!audio) {
      setAudioPreview("");
      return;
    }
    const url = URL.createObjectURL(audio);
    setAudioPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [audio]);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (recordingTimerRef.current !== null) window.clearInterval(recordingTimerRef.current);
    },
    [],
  );

  async function startRecording() {
    setError("");
    setRecordingStarting(true);
    try {
      if (!window.isSecureContext) {
        throw new Error(
          "Microphone recording needs a secure HTTPS connection. You can upload an audio file instead.",
        );
      }
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        throw new Error(
          "Audio recording is not supported here. You can upload an audio file instead.",
        );
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType =
        typeof MediaRecorder.isTypeSupported === "function"
          ? ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((type) =>
              MediaRecorder.isTypeSupported(type),
            )
          : undefined;
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorderFailedRef.current = false;
      recorderTooLargeRef.current = false;
      recorder.ondataavailable = (event) => {
        if (!event.data.size) return;
        chunksRef.current.push(event.data);
        const totalBytes = chunksRef.current.reduce((total, chunk) => total + chunk.size, 0);
        if (totalBytes > MAX_AUDIO_BYTES && recorder.state === "recording") {
          recorderTooLargeRef.current = true;
          recorder.stop();
        }
      };
      recorder.onerror = () => {
        recorderFailedRef.current = true;
        setError(
          "The microphone recording stopped unexpectedly. Please try recording again or upload an audio file.",
        );
      };
      recorder.onstop = () => {
        if (recordingTimerRef.current !== null) {
          window.clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        if (recorderFailedRef.current) {
          setAudio(null);
          stream.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          setRecording(false);
          return;
        }
        if (recorderTooLargeRef.current) {
          setAudio(null);
          setError(
            "Your recording reached the 10 MB limit and was stopped. Please record a shorter message.",
          );
          stream.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          setRecording(false);
          return;
        }
        const type = chunksRef.current.find((chunk) => chunk.type)?.type || recorder.mimeType;
        if (!type) {
          setAudio(null);
          setError(
            "Your browser could not create a playable recording. Try uploading an audio file instead.",
          );
          stream.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          setRecording(false);
          return;
        }
        const blob = new Blob(chunksRef.current, { type });
        if (blob.size > MAX_AUDIO_BYTES) {
          setAudio(null);
          setError("Your recording is over 10 MB. Please record a shorter message.");
        } else if (blob.size) {
          const extension = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
          setAudio(new File([blob], `deekshi-birthday-wish.${extension}`, { type }));
          setError("");
        }
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setRecording(false);
      };
      recorder.start(1000);
      setRecordingSeconds(0);
      recordingTimerRef.current = window.setInterval(
        () => setRecordingSeconds((seconds) => seconds + 1),
        1000,
      );
      setRecording(true);
    } catch (cause) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setError(cause instanceof Error ? cause.message : "Could not access your microphone.");
    } finally {
      setRecordingStarting(false);
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setError("");
    setSuccess(false);
    try {
      const form = new FormData(formElement);
      if (audio) form.set("audio", audio);
      const response = await fetch("/api/public/wishes", { method: "POST", body: form });
      const result = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(result.error ?? "Your wish could not be sent. Please try again.");
      formElement.reset();
      setPhoto(null);
      setVideo(null);
      setAudio(null);
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
          <p className="label-chip text-sm tracking-[.22em] text-jade">A little love for Deekshi</p>
          <h1 className="text-display mt-4 text-6xl sm:text-8xl">Leave a wish for Deekshi</h1>
          <p className="mt-5 text-lg sm:text-xl">Write or record a birthday message for her.</p>
        </header>

        <aside className="mx-auto mb-6 max-w-2xl rounded-2xl border border-gold/60 bg-cream px-5 py-4 text-center text-sm leading-relaxed shadow-sm sm:text-base">
          <strong>Before you send:</strong> Use your full, official name and write a wish. Adding a
          photo is mandatory, even if you are only sending a voice message. Video and audio
          greetings are optional; you can record or upload audio and play it back here before
          submitting.
        </aside>

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
              placeholder="Enter your full, official name"
              className="mt-2 w-full rounded-xl border border-forest/20 bg-cream px-4 py-3 text-base outline-none transition focus:border-jade focus:ring-2 focus:ring-jade/20"
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
              className="mt-2 w-full resize-y rounded-xl border border-forest/20 bg-cream px-4 py-3 text-base leading-relaxed outline-none transition focus:border-jade focus:ring-2 focus:ring-jade/20"
            />

            <label className="label-chip mt-5 block text-sm" htmlFor="wish-photo">
              Your photo <span aria-hidden="true">*</span>
            </label>
            <div className="mt-2 flex items-center gap-4 rounded-xl border border-dashed border-forest/30 bg-cream p-3">
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

            <section
              className="mt-5 rounded-2xl border border-forest/15 bg-cream p-4 sm:p-5"
              aria-labelledby="wish-audio-heading"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-mint text-jade">
                  <AudioLines className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 id="wish-audio-heading" className="label-chip text-sm">
                    Voice message{" "}
                    <span className="font-normal normal-case tracking-normal text-forest/60">
                      (optional)
                    </span>
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-forest/65">
                    Record a voice wish here or upload an audio file. Listen back before you send
                    it.
                  </p>
                  <p className="mt-2 text-xs font-semibold leading-relaxed text-forest/75">
                    After recording, wait 10–15 seconds for it to process. Once the preview is
                    ready, submit your wish promptly to upload it.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {recording ? (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-900"
                  >
                    <Square className="h-4 w-4" aria-hidden="true" />
                    Stop recording
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void startRecording()}
                    disabled={recordingStarting}
                    className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-sm font-bold text-cream disabled:cursor-wait disabled:opacity-60"
                  >
                    <Mic className="h-4 w-4" aria-hidden="true" />
                    {recordingStarting ? "Connecting to microphone…" : "Record a voice wish"}
                  </button>
                )}
                {audio && (
                  <button
                    type="button"
                    onClick={() => setAudio(null)}
                    className="rounded-full border border-forest/20 px-4 py-2 text-sm font-semibold text-forest"
                  >
                    Remove audio
                  </button>
                )}
              </div>
              {recordingStarting && (
                <p role="status" className="mt-3 text-sm font-semibold text-forest">
                  Allow microphone access in your browser prompt to start recording.
                </p>
              )}
              {recording && (
                <p
                  role="status"
                  className="mt-3 flex items-center gap-2 text-sm font-semibold text-red-800"
                >
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
                  </span>
                  Recording live · {Math.floor(recordingSeconds / 60)}:
                  {String(recordingSeconds % 60).padStart(2, "0")} · Tap stop when you are done.
                </p>
              )}
              <label className="label-chip mt-4 block text-xs" htmlFor="wish-audio">
                Or choose an audio file
              </label>
              <input
                id="wish-audio"
                type="file"
                accept="audio/*,.m4a,.mp3,.wav,.ogg,.webm"
                disabled={recording}
                onChange={(event) => {
                  const selected = event.currentTarget.files?.[0] ?? null;
                  if (selected && selected.size > MAX_AUDIO_BYTES) {
                    event.currentTarget.value = "";
                    setAudio(null);
                    setError("Your audio message must be 10 MB or smaller.");
                    return;
                  }
                  setAudio(selected);
                  setError("");
                }}
                className="mt-2 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-mint file:px-4 file:py-2 file:font-bold file:text-forest"
              />
              <p className="mt-1 text-xs text-forest/60">
                MP3, WAV, M4A, OGG or WebM audio · up to 10 MB
              </p>
              {audioPreview && (
                <div className="mt-4 rounded-xl bg-mint/70 p-3">
                  <p className="mb-2 text-xs font-semibold text-forest">
                    Preview your voice wish: {audio?.name}
                  </p>
                  <audio controls preload="metadata" src={audioPreview} className="w-full">
                    Your browser cannot play this audio.
                  </audio>
                </div>
              )}
            </section>

            <label className="label-chip mt-5 block text-sm" htmlFor="wish-video">
              Video greeting{" "}
              <span className="font-normal normal-case tracking-normal text-forest/60">
                (optional)
              </span>
            </label>
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-forest/15 bg-cream p-3">
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
                birthday page, including the audio or video greeting I choose to share.
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
              disabled={busy || !photo || recording}
              className="label-chip mt-5 inline-flex w-full items-center justify-center gap-3 rounded-full bg-gold px-6 py-4 text-lg text-forest shadow-sticker transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
            >
              {busy ? "Sending your wish…" : "Send birthday wish"}
              <Send className="h-5 w-5" aria-hidden="true" />
            </button>
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
