import { useEffect, useState } from "react";
import { BirthdayWishManager } from "@/components/admin/BirthdayWishManager";
import {
  MAX_WALL_PHOTOS,
  photoUrl,
  type BackgroundVideo,
  type Photo,
  type SiteContent,
} from "@/lib/site-content";
import {
  clearPhotoWall,
  getRenderDeploymentInfo,
  removeBackgroundVideo,
  removeBirthdayAudio,
  saveSiteContent,
  uploadBackgroundVideo,
  uploadBirthdayAudio,
  uploadPhoto,
} from "@/lib/site.functions";

type PathPart = string | number;
type EditorProps = {
  label: string;
  value: unknown;
  path: PathPart[];
  token: string;
  onChange: (path: PathPart[], value: unknown) => void;
  onNotice: (message: string) => void;
};

const fieldClass =
  "mt-1 w-full rounded-lg border border-forest-deep/20 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-forest focus:ring-2 focus:ring-forest/20";
const buttonClass =
  "rounded-lg border border-forest-deep/20 px-3 py-2 text-sm font-semibold text-forest-deep hover:bg-mint";

function isPhoto(value: unknown): value is {
  id: string | null;
  w: number;
  h: number;
  alt: string;
  caption: string;
  shape: string;
} {
  return (
    !!value &&
    typeof value === "object" &&
    "id" in value &&
    "w" in value &&
    "h" in value &&
    "alt" in value &&
    "caption" in value
  );
}

function isBackgroundVideo(value: unknown): value is BackgroundVideo {
  return (
    !!value &&
    typeof value === "object" &&
    "blendMode" in value &&
    "opacity" in value &&
    "blur" in value &&
    "id" in value
  );
}
function isBirthdayAudio(value: unknown): value is { id: string | null } {
  return !!value && typeof value === "object" && "id" in value && Object.keys(value).length === 1;
}

function updateAt(root: unknown, path: PathPart[], value: unknown): unknown {
  if (!path.length) return value;
  const [head, ...tail] = path;
  if (Array.isArray(root) && typeof head === "number") {
    const copy = [...root];
    copy[head] = updateAt(copy[head], tail, value);
    return copy;
  }
  if (root && typeof root === "object" && typeof head === "string") {
    return { ...root, [head]: updateAt((root as Record<string, unknown>)[head], tail, value) };
  }
  return root;
}

function defaultItem(items: unknown[]) {
  const sample = items[0];
  if (typeof sample === "string") return "";
  if (typeof sample === "number") return 0;
  if (sample && typeof sample === "object") return structuredClone(sample);
  return "";
}

function RenderDeploymentInfo({ token }: { token: string }) {
  const [info, setInfo] = useState<Awaited<ReturnType<typeof getRenderDeploymentInfo>> | null>(
    null,
  );
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void getRenderDeploymentInfo({ data: { token } })
      .then((result) => {
        if (active) setInfo(result);
      })
      .catch(() => {
        if (active)
          setError("Could not load deployment details. Please unlock admin again and retry.");
      });
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <section className="mb-6 rounded-2xl border bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-bold text-slate-900">Render deployment</h2>
      <p className="mt-1 text-sm text-slate-600">
        Read-only details for the deployment serving this page.
      </p>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      ) : !info ? (
        <p className="mt-3 text-sm text-slate-500">Loading deployment details…</p>
      ) : !info.available ? (
        <p className="mt-3 text-sm text-slate-600">
          This app is not running on Render, so Render deployment details are unavailable.
        </p>
      ) : (
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Service
            </dt>
            <dd className="mt-1 break-words text-sm font-medium text-slate-900">
              {info.service ?? "Unavailable"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Git repository
            </dt>
            <dd className="mt-1 break-words text-sm font-medium text-slate-900">
              {info.repo ?? "Unavailable"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Branch</dt>
            <dd className="mt-1 break-words text-sm font-medium text-slate-900">
              {info.branch ?? "Unavailable"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Commit</dt>
            <dd className="mt-1 break-all font-mono text-xs text-slate-900">
              {info.commit ?? "Unavailable"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Public URL
            </dt>
            <dd className="mt-1 break-all text-sm">
              {info.url ? (
                <a
                  className="font-medium text-forest underline"
                  href={info.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {info.url}
                </a>
              ) : (
                <span className="text-slate-600">Unavailable</span>
              )}
            </dd>
          </div>
        </dl>
      )}
      <p className="mt-4 text-xs text-slate-500">
        Render account email and workspace are private dashboard details and are not exposed to the
        app. Open the Render Dashboard to manage them.
      </p>
      <a
        href="https://dashboard.render.com"
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex rounded-lg border border-forest-deep/20 px-3 py-2 text-sm font-semibold text-forest-deep hover:bg-mint"
      >
        Open Render Dashboard
      </a>
    </section>
  );
}

function ValueEditor({ label, value, path, token, onChange, onNotice }: EditorProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const inputId = `field-${path.join("-")}`;

  if (isPhoto(value)) {
    const photo = value;
    return (
      <fieldset className="mt-3 rounded-xl border border-forest-deep/15 bg-mint/50 p-3">
        <legend className="px-1 text-sm font-bold text-forest-deep">{label}</legend>
        {photo.id && (
          <img
            src={photoUrl(photo.id)}
            alt={photo.alt}
            className="mb-3 max-h-48 rounded-lg object-cover"
          />
        )}
        <label className="block text-xs font-semibold text-slate-700" htmlFor={`${inputId}-upload`}>
          Upload image (JPG, PNG, WebP or GIF, max 8 MB)
        </label>
        <input
          id={`${inputId}-upload`}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="mt-1 block w-full text-sm"
          disabled={uploading}
          onChange={async (event) => {
            const input = event.currentTarget;
            const file = input.files?.[0];
            if (!file) return;
            setUploading(true);
            setUploadError("");
            try {
              const bitmap = await createImageBitmap(file);
              const form = new FormData();
              form.set("token", token);
              form.set("file", file);
              form.set("w", String(bitmap.width));
              form.set("h", String(bitmap.height));
              const uploaded = await uploadPhoto({ data: form });
              onChange(path, { ...photo, id: uploaded.id, w: uploaded.w, h: uploaded.h });
              onNotice("Photo uploaded to MongoDB. Select Save changes to publish it.");
              bitmap.close();
            } catch (error) {
              setUploadError(error instanceof Error ? error.message : "Upload failed.");
            } finally {
              setUploading(false);
              input.value = "";
            }
          }}
        />
        {uploading && <p className="mt-1 text-xs text-forest">Uploading to MongoDB…</p>}
        {uploadError && (
          <p role="alert" className="mt-1 text-xs text-red-700">
            {uploadError}
          </p>
        )}
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(["alt", "caption"] as const).map((key) => (
            <label key={key} className="text-xs font-semibold capitalize text-slate-700">
              {key}
              <input
                className={fieldClass}
                maxLength={key === "alt" ? 200 : 240}
                value={photo[key]}
                onChange={(e) => onChange([...path, key], e.target.value)}
              />
            </label>
          ))}
        </div>
        <label className="mt-2 block text-xs font-semibold text-slate-700">
          Shape
          <select
            className={fieldClass}
            value={photo.shape}
            onChange={(e) => onChange([...path, "shape"], e.target.value)}
          >
            {["portrait", "landscape", "square", "tall", "wide"].map((shape) => (
              <option key={shape}>{shape}</option>
            ))}
          </select>
        </label>
      </fieldset>
    );
  }

  if (isBackgroundVideo(value)) {
    const video = value;
    return (
      <fieldset className="mt-3 rounded-xl border border-forest-deep/15 bg-mint/50 p-3">
        <legend className="px-1 text-sm font-bold text-forest-deep">
          Subtle blended background video
        </legend>
        {video.id && (
          <video
            src={`/api/public/background-video/${video.id}`}
            muted
            autoPlay
            loop
            playsInline
            className="mb-3 h-40 w-full rounded-lg bg-forest-deep object-cover"
            style={{
              opacity: video.opacity,
              mixBlendMode: video.blendMode,
              filter: `blur(${video.blur}px)`,
            }}
          />
        )}
        {video.id && (
          <button
            type="button"
            disabled={uploading}
            className="mb-3 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-800 hover:bg-red-50 disabled:opacity-50"
            onClick={async () => {
              if (
                !window.confirm("Remove the current background video from the website and MongoDB?")
              )
                return;
              setUploading(true);
              setUploadError("");
              try {
                const result = await removeBackgroundVideo({ data: { token } });
                onChange(path, result.content.backgroundVideo);
                onNotice("Background video removed from the website and MongoDB.");
              } catch (error) {
                setUploadError(
                  error instanceof Error ? error.message : "Couldn't remove the background video.",
                );
              } finally {
                setUploading(false);
              }
            }}
          >
            Remove background video
          </button>
        )}
        <label
          className="block text-xs font-semibold text-slate-700"
          htmlFor={`${inputId}-video-upload`}
        >
          Upload an MP4, WebM or Ogg loop (max 12 MB)
        </label>
        <input
          id={`${inputId}-video-upload`}
          type="file"
          accept="video/mp4,video/webm,video/ogg"
          className="mt-1 block w-full text-sm"
          onChange={async (event) => {
            const input = event.currentTarget;
            const file = input.files?.[0];
            if (!file) return;
            setUploading(true);
            setUploadError("");
            try {
              const form = new FormData();
              form.set("token", token);
              form.set("file", file);
              const uploaded = await uploadBackgroundVideo({ data: form });
              onChange(path, { ...video, id: uploaded.id });
              setUploadError("Video uploaded. Save changes to publish it.");
            } catch (error) {
              setUploadError(error instanceof Error ? error.message : "Video upload failed.");
            } finally {
              setUploading(false);
              input.value = "";
            }
          }}
        />
        {uploading && <p className="mt-1 text-xs text-forest">Uploading video to MongoDB…</p>}
        {uploadError && (
          <p role="status" className="mt-1 text-xs text-forest">
            {uploadError}
          </p>
        )}
        <label className="mt-4 block text-xs font-semibold text-slate-700">
          Opacity <span className="font-normal">{Math.round(video.opacity * 100)}%</span>
          <input
            aria-label="Background video opacity"
            type="range"
            min="0"
            max="0.6"
            step="0.01"
            value={video.opacity}
            onChange={(e) => onChange([...path, "opacity"], Number(e.target.value))}
            className="mt-1 block w-full"
          />
        </label>
        <label className="mt-3 block text-xs font-semibold text-slate-700">
          Blend mode
          <select
            className={fieldClass}
            value={video.blendMode}
            onChange={(e) => onChange([...path, "blendMode"], e.target.value)}
          >
            {[
              "soft-light",
              "overlay",
              "screen",
              "multiply",
              "hard-light",
              "lighten",
              "darken",
              "normal",
            ].map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-3 block text-xs font-semibold text-slate-700">
          Blur <span className="font-normal">{video.blur}px</span>
          <input
            aria-label="Background video blur"
            type="range"
            min="0"
            max="24"
            step="1"
            value={video.blur}
            onChange={(e) => onChange([...path, "blur"], Number(e.target.value))}
            className="mt-1 block w-full"
          />
        </label>
        <p className="mt-2 text-xs text-slate-600">
          Muted, looping video blends over the page colors and never blocks clicks. Save changes to
          publish your settings.
        </p>
      </fieldset>
    );
  }

  if (isBirthdayAudio(value)) {
    return (
      <fieldset className="mt-3 rounded-xl border border-forest-deep/15 bg-mint/50 p-3">
        <legend className="px-1 text-sm font-bold text-forest-deep">Birthday soundtrack</legend>
        {value.id && (
          <audio
            controls
            loop
            preload="metadata"
            src={`/api/public/birthday-audio/${value.id}`}
            className="mb-3 w-full"
          />
        )}
        {value.id && (
          <button
            type="button"
            disabled={uploading}
            className="mb-3 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-800 hover:bg-red-50 disabled:opacity-50"
            onClick={async () => {
              if (!window.confirm("Remove the birthday MP3 from the website and MongoDB?")) return;
              setUploading(true);
              setUploadError("");
              try {
                const result = await removeBirthdayAudio({ data: { token } });
                onChange(path, result.content.birthdayAudio);
                onNotice("Birthday MP3 removed from the website and MongoDB.");
              } catch (error) {
                setUploadError(error instanceof Error ? error.message : "Couldn't remove the MP3.");
              } finally {
                setUploading(false);
              }
            }}
          >
            Remove birthday MP3
          </button>
        )}
        <label
          className="block text-xs font-semibold text-slate-700"
          htmlFor={`${inputId}-audio-upload`}
        >
          Upload an MP3 soundtrack (max 15 MB)
        </label>
        <input
          id={`${inputId}-audio-upload`}
          type="file"
          accept="audio/mpeg,.mp3"
          className="mt-1 block w-full text-sm"
          disabled={uploading}
          onChange={async (event) => {
            const input = event.currentTarget;
            const file = input.files?.[0];
            if (!file) return;
            setUploading(true);
            setUploadError("");
            try {
              const form = new FormData();
              form.set("token", token);
              form.set("file", file);
              const uploaded = await uploadBirthdayAudio({ data: form });
              onChange(path, { id: uploaded.id });
              setUploadError("MP3 uploaded to MongoDB. Save changes to publish it.");
            } catch (error) {
              setUploadError(error instanceof Error ? error.message : "MP3 upload failed.");
            } finally {
              setUploading(false);
              input.value = "";
            }
          }}
        />
        {uploading && <p className="mt-1 text-xs text-forest">Uploading MP3 to MongoDB…</p>}
        {uploadError && (
          <p role="status" className="mt-1 text-xs text-forest">
            {uploadError}
          </p>
        )}
        <p className="mt-2 text-xs text-slate-600">
          The page soundtrack loops. Visitors can start it with the play control; browsers require a
          tap before audio can play.
        </p>
      </fieldset>
    );
  }

  if (Array.isArray(value)) {
    return (
      <fieldset className="mt-4 rounded-xl border border-slate-200 p-3">
        <legend className="px-1 text-sm font-bold text-slate-800">
          {label} <span className="font-normal text-slate-500">({value.length})</span>
        </legend>
        <div className="space-y-2">
          {value.map((item, index) => (
            <div key={index} className="rounded-lg bg-slate-50 p-2">
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-xs font-semibold text-red-700"
                  onClick={() =>
                    onChange(
                      path,
                      value.filter((_, i) => i !== index),
                    )
                  }
                >
                  Remove
                </button>
              </div>
              <ValueEditor
                label={`${label} ${index + 1}`}
                value={item}
                path={[...path, index]}
                token={token}
                onChange={onChange}
                onNotice={onNotice}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          className={`${buttonClass} mt-3`}
          onClick={() => onChange(path, [...value, defaultItem(value)])}
        >
          Add {label.toLowerCase()}
        </button>
      </fieldset>
    );
  }

  if (value && typeof value === "object") {
    return (
      <fieldset className="mt-3 rounded-xl border border-slate-200 p-3">
        <legend className="px-1 text-sm font-bold text-slate-800">{label}</legend>
        <div className="grid gap-x-4 sm:grid-cols-2">
          {Object.entries(value).map(([key, child]) => (
            <div key={key} className={child && typeof child === "object" ? "sm:col-span-2" : ""}>
              <ValueEditor
                label={key}
                value={child}
                path={[...path, key]}
                token={token}
                onChange={onChange}
                onNotice={onNotice}
              />
            </div>
          ))}
        </div>
      </fieldset>
    );
  }

  const text = typeof value === "string" ? value : String(value ?? "");
  if (typeof value === "boolean")
    return (
      <label
        htmlFor={inputId}
        className="mt-3 flex items-center gap-2 text-xs font-semibold capitalize text-slate-700"
      >
        <input
          id={inputId}
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(path, e.target.checked)}
        />
        {label}
      </label>
    );
  const long =
    text.length > 90 ||
    ["body", "message", "intro", "heading", "note", "phrase"].includes(label.toLowerCase());
  return (
    <label htmlFor={inputId} className="mt-3 block text-xs font-semibold capitalize text-slate-700">
      {label}
      {long ? (
        <textarea
          id={inputId}
          className={fieldClass}
          rows={3}
          value={text}
          onChange={(e) => onChange(path, e.target.value)}
        />
      ) : (
        <input
          id={inputId}
          className={fieldClass}
          value={text}
          onChange={(e) => onChange(path, e.target.value)}
        />
      )}
    </label>
  );
}

export function ContentEditor({
  initialContent,
  token,
}: {
  initialContent: SiteContent;
  token: string;
}) {
  const [draft, setDraft] = useState(initialContent);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [clearingWall, setClearingWall] = useState(false);
  const sections = Object.keys(draft).filter((key) => key !== "pages" && key !== "finale");
  const onChange = (path: PathPart[], value: unknown) =>
    setDraft((old) => updateAt(old, path, value) as SiteContent);

  async function save() {
    setBusy(true);
    setNotice("");
    try {
      const result = await saveSiteContent({ data: { token, content: draft } });
      setDraft(result.content);
      setNotice("Saved to MongoDB.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Couldn't save changes.");
    } finally {
      setBusy(false);
    }
  }

  function addPage() {
    let n = draft.pages.length + 1;
    let slug = `new-page-${n}`;
    while (draft.pages.some((page) => page.slug === slug)) slug = `new-page-${++n}`;
    setDraft((old) => ({
      ...old,
      pages: [...old.pages, { slug, title: `New page ${n}`, body: "Add your text here." }],
    }));
  }

  async function uploadWallPhotos(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;
    const slots = MAX_WALL_PHOTOS - draft.wall.photos.filter((photo) => photo.id).length;
    if (slots < 1) {
      setNotice(`The photo wall already has its ${MAX_WALL_PHOTOS}-photo limit.`);
      input.value = "";
      return;
    }
    const selected = files.slice(0, slots);
    const uploaded: Photo[] = [];
    setBulkBusy(true);
    setNotice("");
    try {
      for (let index = 0; index < selected.length; index++) {
        const file = selected[index]!;
        setNotice(`Uploading photo ${index + 1} of ${selected.length} to MongoDB…`);
        const bitmap = await createImageBitmap(file);
        try {
          const form = new FormData();
          form.set("token", token);
          form.set("file", file);
          form.set("w", String(bitmap.width));
          form.set("h", String(bitmap.height));
          const result = await uploadPhoto({ data: form });
          uploaded.push({
            id: result.id,
            w: result.w,
            h: result.h,
            alt: file.name.slice(0, 200),
            caption: "",
            shape:
              result.w === result.h ? "square" : result.w > result.h ? "landscape" : "portrait",
          });
        } finally {
          bitmap.close();
        }
      }
      setDraft((old) => {
        const current = old.wall.photos.filter((photo) => photo.id);
        return { ...old, wall: { ...old.wall, photos: [...current, ...uploaded] } };
      });
      setNotice(
        `${uploaded.length} photo${uploaded.length === 1 ? "" : "s"} uploaded to MongoDB. Select Save changes to link them to the website.`,
      );
      if (files.length > selected.length)
        setNotice(
          (current) =>
            `${current} ${files.length - selected.length} file(s) skipped because the wall holds at most ${MAX_WALL_PHOTOS}.`,
        );
    } catch (error) {
      setNotice(
        `${uploaded.length} uploaded so far. ${error instanceof Error ? error.message : "The next upload failed."} Save changes to link uploaded photos.`,
      );
    } finally {
      setBulkBusy(false);
      input.value = "";
    }
  }

  async function clearWall() {
    if (
      !window.confirm(
        "Clear every photo from the public wall and delete its uploaded MongoDB files? Photos also used in Memories or other sections will be kept.",
      )
    )
      return;
    setClearingWall(true);
    setNotice("");
    try {
      const result = await clearPhotoWall({ data: { token } });
      setDraft(result.content);
      setNotice("Photo wall cleared. Upload a fresh batch, then save changes to publish it.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Couldn't clear the photo wall.");
    } finally {
      setClearingWall(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8">
      <header className="sticky top-0 z-10 -mx-4 mb-6 flex items-center justify-between gap-3 border-b bg-white/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div>
          <h1 className="text-xl font-black text-forest-deep">Birthday site editor</h1>
          <p className="text-xs text-slate-600">Changes save to MongoDB.</p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={save}
          className="rounded-lg bg-forest px-5 py-2.5 text-sm font-bold text-white hover:bg-forest-deep disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save changes"}
        </button>
      </header>
      {notice && (
        <p role="status" className="mb-4 rounded-lg bg-mint p-3 text-sm text-forest-deep">
          {notice}
        </p>
      )}
      <RenderDeploymentInfo token={token} />
      <BirthdayWishManager token={token} />
      <section className="mb-6 rounded-2xl border bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-slate-900">Birthday page content</h2>
        <p className="text-sm text-slate-600">
          Edit all text, wishes, and photo slots. Uploaded photos go straight to MongoDB.
        </p>
        <div className="mt-4 rounded-xl border border-dashed border-forest/40 bg-mint p-4">
          <label htmlFor="wall-photo-upload" className="block font-bold text-forest-deep">
            Upload a batch to the photo wall
          </label>
          <p className="mt-1 text-sm text-slate-700">
            Select multiple JPG, PNG, WebP, or GIF files. Each must be at most 8 MB. Uploads are
            added to MongoDB and shown in the public photo wall after saving.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              id="wall-photo-upload"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={bulkBusy || clearingWall}
              onChange={uploadWallPhotos}
              className="block min-w-0 flex-1 text-sm"
            />
            <button
              type="button"
              disabled={bulkBusy || clearingWall}
              onClick={clearWall}
              className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-800 hover:bg-red-50 disabled:opacity-50"
            >
              {clearingWall ? "Clearing…" : "Clear all wall photos"}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            Clearing removes wall uploads from MongoDB. Photos referenced by other sections are
            preserved. After clearing, choose a fresh batch and save.
          </p>
        </div>
        <div className="mt-4 rounded-xl border border-forest/20 bg-white p-4">
          <h3 className="font-bold text-forest-deep">Birthday card photo</h3>
          <p className="mt-1 text-sm text-slate-600">
            Choose the photo shown on the downloadable birthday keepsake card.
          </p>
          <ValueEditor
            label="Card photo"
            value={draft.keepsake.photo}
            path={["keepsake", "photo"]}
            token={token}
            onChange={onChange}
            onNotice={setNotice}
          />
        </div>
        {sections.map((key) => (
          <details
            key={key}
            className="mt-4 rounded-xl border border-slate-200 p-3"
            open={key === "name" || key === "hero" || key === "backgroundVideo"}
          >
            <summary className="cursor-pointer font-bold capitalize text-forest-deep">
              {key === "backgroundVideo" ? "Background video" : key}
            </summary>
            <ValueEditor
              label={key}
              value={(draft as unknown as Record<string, unknown>)[key]}
              path={[key]}
              token={token}
              onChange={onChange}
              onNotice={setNotice}
            />
          </details>
        ))}
      </section>
      <section className="mb-8 rounded-2xl border bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Additional pages</h2>
            <p className="text-sm text-slate-600">
              Add pages at /p/your-page-name. They’re saved with the site content.
            </p>
          </div>
          <button type="button" className={buttonClass} onClick={addPage}>
            Add page
          </button>
        </div>
        {draft.pages.map((page, index) => (
          <div
            key={`${page.slug}-${index}`}
            className="mt-4 rounded-xl border border-slate-200 p-3"
          >
            <div className="flex justify-between">
              <h3 className="font-bold text-forest-deep">Page {index + 1}</h3>
              <button
                type="button"
                className="text-xs font-semibold text-red-700"
                onClick={() =>
                  onChange(
                    ["pages"],
                    draft.pages.filter((_, i) => i !== index),
                  )
                }
              >
                Remove page
              </button>
            </div>
            <ValueEditor
              label="Page"
              value={page}
              path={["pages", index]}
              token={token}
              onChange={onChange}
              onNotice={setNotice}
            />
            <p className="mt-2 text-xs text-slate-500">Public URL: /p/{page.slug}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
