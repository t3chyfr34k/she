import { useEffect, useState, type CSSProperties } from "react";
import { BirthdayWishManager } from "@/components/admin/BirthdayWishManager";
import {
  DEFAULT_CONTENT,
  PALETTE_KEYS,
  PALETTE_PRESETS,
  emptyPhoto,
  paletteCssVariables,
  photoUrl,
  type BackgroundVideo,
  type ColorPalette,
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
  "mt-1 w-full rounded-lg border border-forest-deep/20 bg-cream px-3 py-2 text-sm text-slate-900 outline-none focus:border-forest focus:ring-2 focus:ring-forest/20";
const buttonClass =
  "rounded-lg border border-forest-deep/20 px-3 py-2 text-sm font-semibold text-forest-deep hover:bg-mint";
const EDITABLE_SECTIONS = [
  "name",
  "hero",
  "pullTab",
  "ribbon",
  "memories",
  "wall",
  "wishes",
  "statement",
  "finale",
  "letter",
  "keepsake",
];

const FIELD_HELP: Record<string, string> = {
  name: "Birthday girl's name shown across the page. Leave blank if you prefer no name.",
  "hero.tagline": "Small line above the birthday headline.",
  "hero.leftWord": "First large word in the birthday headline.",
  "hero.badge": "Short text inside the small badge between the headline words.",
  "hero.rightWord": "Second large phrase in the birthday headline.",
  "hero.line1": "First line of the main birthday greeting.",
  "hero.line2": "Second line of the main birthday greeting.",
  "hero.sticker": "Small sticker text. Use {name} to insert the birthday girl's name.",
  "hero.hint": "Short instruction shown near the birthday cake interaction.",
  "pullTab.hint": "Small hint beside the pull tab.",
  "pullTab.label": "Text printed on the pull tab.",
  "pullTab.messages":
    "Secret messages revealed when visitors pull the tab; add or remove lines below.",
  "ribbon.phrase": "Scrolling words shown on the ribbon strip.",
  "memories.label": "Small label above the large memories heading.",
  "memories.bigWord": "Large background title in the memories section.",
  "memories.starring": "Small label above the birthday girl's name in the center badge.",
  "memories.edition": "Short playful line beneath her name in the badge.",
  "memories.seal": "Text repeated around the round seal near the badge.",
  "memories.chips": "Small memory captions displayed as chips; add or remove captions below.",
  "memories.photos":
    "Photos displayed around the center badge; each photo can be uploaded or removed below.",
  "wall.label": "Small label above the photo wall title.",
  "wall.title": "First part of the photo wall heading.",
  "wall.highlight": "Highlighted part of the photo wall heading.",
  "wall.intro": "Short instruction displayed under the photo wall title.",
  "wall.photos":
    "Photos shown in the photo wall. Upload a batch above or edit individual photo details here.",
  "wishes.title": "First part of the wishes section heading.",
  "wishes.highlight": "Highlighted part of the wishes section heading.",
  "wishes.intro": "Optional introduction above the birthday wishes.",
  "wishes.items":
    "Each item becomes one wish in the wheel. Leave the list empty to hide the wheel.",
  "wishes.items.title": "Short title shown on the wish circle.",
  "wishes.items.note": "Message shown when this wish is selected.",
  "statement.heading":
    "Introductory lines in the celebration section. Use a new line to split them.",
  "statement.big": "Large scrolling phrase in the celebration section.",
  "statement.coinTop": "Top word on the small coin graphic.",
  "statement.coinBottom": "Bottom word on the small coin graphic.",
  "statement.note": "Small note displayed beside the celebration graphic.",
  "finale.greeting":
    "Greeting above the final birthday wish. Use {name} for the birthday girl's name.",
  "finale.title": "First word of the final wish heading.",
  "finale.highlight": "Highlighted words in the final wish heading.",
  "finale.message": "Message shown with the final birthday wish.",
  "finale.button": "Button label before the birthday interaction is complete.",
  "finale.buttonDone": "Button label after the interaction is complete.",
  "finale.watermark": "Small decorative text in the final section.",
  "finale.footer": "Sign-off at the bottom of the birthday page.",
  "letter.kicker": "Handwritten-style line above the letter title.",
  "letter.title": "Main title of the birthday letter.",
  "letter.description": "Short subtitle below the letter title.",
  "letter.paragraphs": "Letter paragraphs shown in order; add or remove paragraphs below.",
  "letter.signature": "Sign-off at the end of the birthday letter.",
  "keepsake.enabled": "Turn the downloadable keepsake card on or off.",
  "keepsake.wish": "Short message printed above the card poem.",
  "keepsake.poem": "Main message printed on the downloadable birthday card.",
  "keepsake.signature": "Sign-off printed at the bottom of the card.",
  "pages.slug": "Unique URL part for this page, using lowercase letters, numbers, and hyphens.",
  "pages.title": "Heading displayed at the top of this custom page.",
  "pages.body": "Text displayed on this custom page.",
};

const ARRAY_HELP: Record<string, string> = {
  "pullTab.messages": FIELD_HELP["pullTab.messages"]!,
  "memories.chips": FIELD_HELP["memories.chips"]!,
  "memories.photos": FIELD_HELP["memories.photos"]!,
  "wall.photos": FIELD_HELP["wall.photos"]!,
  "wishes.items": FIELD_HELP["wishes.items"]!,
  "letter.paragraphs": FIELD_HELP["letter.paragraphs"]!,
};

const SECTION_LABELS: Record<string, string> = {
  name: "Birthday person's name",
  hero: "Opening scene",
  pullTab: "Pull-tab surprise",
  ribbon: "Ribbon message and photo",
  memories: "Memories",
  wall: "Photo wall",
  wishes: "Birthday wishes",
  statement: "Celebration statement",
  finale: "Closing wish",
  letter: "Birthday letter",
  keepsake: "Birthday card",
};

const FIELD_LABELS: Record<string, string> = {
  tagline: "Intro line",
  leftWord: "Headline word 1",
  badge: "Center badge",
  rightWord: "Headline word 2",
  line1: "Greeting line 1",
  line2: "Greeting line 2",
  sticker: "Sticker text",
  hint: "Visitor hint",
  bigWord: "Large background title",
  starring: "Center badge label",
  edition: "Tagline under the name",
  seal: "Round seal text",
  coinTop: "Coin top text",
  coinBottom: "Coin bottom text",
  kicker: "Small line above title",
  description: "Subtitle",
  paragraphs: "Message paragraphs",
  signature: "Sign-off",
  wish: "Short birthday wish",
  poem: "Card message",
  intro: "Introduction",
  highlight: "Highlighted words",
  title: "Title",
  note: "Message",
  body: "Page text",
  slug: "Page URL name",
  alt: "Image description",
  caption: "Image caption",
};

function pathKey(path: PathPart[]) {
  return path.filter((part) => typeof part !== "number").join(".");
}

function displayLabel(label: string) {
  return FIELD_LABELS[label] ?? label.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function fieldHelp(path: PathPart[]) {
  const key = pathKey(path);
  if (path.some((part) => typeof part === "number") && ARRAY_HELP[key]) return undefined;
  if (FIELD_HELP[key]) return FIELD_HELP[key];
  if (key.endsWith(".alt"))
    return "Describe the image for screen readers; you can leave this blank.";
  if (key.endsWith(".caption")) return "Optional caption associated with this image.";
  if (key.endsWith(".shape")) return "Choose the image frame shape used in the layout.";
  return undefined;
}

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

function defaultItem(items: unknown[], path: PathPart[]) {
  const sample = items[0];
  if (sample === undefined) {
    const key = pathKey(path);
    if (key === "wishes.items") return { title: "", note: "" };
    if (key === "wall.photos" || key === "memories.photos")
      return emptyPhoto("square", "Add a photo");
    let fallback: unknown = DEFAULT_CONTENT;
    for (const part of path) {
      if (!fallback || typeof fallback !== "object") return "";
      fallback = (fallback as Record<string, unknown>)[String(part)];
    }
    if (Array.isArray(fallback)) {
      const template = fallback[0];
      if (template && typeof template === "object") return structuredClone(template);
    }
    return "";
  }
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
    <section className="mb-6 rounded-2xl border bg-cream p-4 shadow-sm sm:p-6">
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
        <legend className="px-1 text-sm font-bold text-forest-deep">{displayLabel(label)}</legend>
        {ARRAY_HELP[pathKey(path)] && (
          <p className="mb-3 text-xs text-slate-600">{ARRAY_HELP[pathKey(path)]}</p>
        )}
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
            <div key={key}>
              <label className="text-xs font-semibold capitalize text-slate-700">
                {displayLabel(key)}
                <input
                  className={fieldClass}
                  value={photo[key]}
                  onChange={(e) => onChange([...path, key], e.target.value)}
                />
              </label>
              {fieldHelp([...path, key]) && (
                <p className="mt-1 text-xs font-normal text-slate-500">
                  {fieldHelp([...path, key])}
                </p>
              )}
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Photo framing is handled by the template. Add an optional description or caption.
        </p>
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
        <p className="mb-3 text-xs text-slate-600">
          Upload a subtle looping background video. Adjust opacity, blend, and blur to control its
          appearance.
        </p>
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
        <p className="mt-1 text-xs text-slate-500">Controls how visible the background video is.</p>
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
        <p className="mt-1 text-xs text-slate-500">
          Controls how the video colors mix with the page.
        </p>
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
        <p className="mt-1 text-xs text-slate-500">
          Softens the video edges; set to zero for no blur.
        </p>
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
    const help = ARRAY_HELP[pathKey(path)];
    return (
      <fieldset className="mt-4 rounded-xl border border-slate-200 p-3">
        <legend className="px-1 text-sm font-bold text-slate-800">
          {label} <span className="font-normal text-slate-500">({value.length})</span>
        </legend>
        {help && <p className="mb-3 text-xs text-slate-600">{help}</p>}
        <div className="space-y-2">
          {value.map((item, index) => (
            <div key={index} className="rounded-lg bg-mint p-2">
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
          onClick={() => onChange(path, [...value, defaultItem(value, path)])}
        >
          Add {label.toLowerCase()}
        </button>
      </fieldset>
    );
  }

  if (value && typeof value === "object") {
    return (
      <fieldset className="mt-3 rounded-xl border border-slate-200 p-3">
        <legend className="px-1 text-sm font-bold text-slate-800">{displayLabel(label)}</legend>
        <div className="grid gap-x-4 sm:grid-cols-2">
          {Object.entries(value)
            .filter(([key]) => key !== "enabled" && key !== "shape")
            .map(([key, child]) => (
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
      <div>
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
          {displayLabel(label)}
        </label>
        {fieldHelp(path) && <p className="ml-5 text-xs text-slate-500">{fieldHelp(path)}</p>}
      </div>
    );
  const long =
    text.length > 90 ||
    ["body", "message", "intro", "heading", "note", "phrase", "poem"].includes(label.toLowerCase());
  return (
    <div className="mt-3">
      <label htmlFor={inputId} className="block text-xs font-semibold capitalize text-slate-700">
        {displayLabel(label)}
        {long ? (
          <textarea
            id={inputId}
            className={fieldClass}
            rows={label.toLowerCase() === "poem" ? 8 : 3}
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
      {fieldHelp(path) && <p className="mt-1 text-xs text-slate-500">{fieldHelp(path)}</p>}
    </div>
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
  const sections = EDITABLE_SECTIONS.filter((key) => key in draft);
  const onChange = (path: PathPart[], value: unknown) =>
    setDraft((old) => updateAt(old, path, value) as SiteContent);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("birthday-palette-change", { detail: draft.palette }));
  }, [draft.palette]);

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

  function loadTemplate() {
    if (
      !window.confirm(
        "Replace the current text and selected photos in this editor with the clean birthday template? This only goes live after you save.",
      )
    )
      return;
    setDraft(structuredClone(DEFAULT_CONTENT));
    setNotice("Clean template loaded. Select Save changes to publish it.");
  }

  function assignUploadedPhotos(photos: Photo[]) {
    const randomized = [...photos];
    for (let index = randomized.length - 1; index > 0; index--) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [randomized[index], randomized[swapIndex]] = [randomized[swapIndex]!, randomized[index]!];
    }
    setDraft((old) => {
      const next = structuredClone(old);
      const makePhoto = (file: Photo | undefined, current: Photo): Photo =>
        file
          ? { ...current, id: file.id, w: file.w, h: file.h, alt: file.alt, shape: file.shape }
          : { ...current, id: null, w: 0, h: 0 };
      next.ribbon.photo = makePhoto(randomized[0], old.ribbon.photo);
      next.statement.photo = makePhoto(randomized[1], old.statement.photo);
      next.keepsake.photo = makePhoto(randomized[2], old.keepsake.photo);
      const galleryPhotos = randomized.slice(3);
      next.wall.photos = galleryPhotos.filter((_, index) => index % 2 === 0);
      next.memories.photos = galleryPhotos.filter((_, index) => index % 2 === 1);
      return next;
    });
  }

  async function uploadPhotoBatch(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;
    const selected = files;
    const uploaded: Photo[] = [];
    const seenFiles = new Set<string>();
    let skippedDuplicates = 0;
    setBulkBusy(true);
    setNotice("");
    try {
      for (let index = 0; index < selected.length; index++) {
        const file = selected[index]!;
        setNotice(`Checking and uploading photo ${index + 1} of ${selected.length}…`);
        const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
        const fingerprint = Array.from(new Uint8Array(digest), (byte) =>
          byte.toString(16).padStart(2, "0"),
        ).join("");
        if (seenFiles.has(fingerprint)) {
          skippedDuplicates++;
          continue;
        }
        seenFiles.add(fingerprint);
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
            alt: file.name,
            caption: "",
            shape:
              result.w === result.h ? "square" : result.w > result.h ? "landscape" : "portrait",
          });
        } finally {
          bitmap.close();
        }
      }
      // Shuffle unique uploads so successive batches don't always land in the same slots.
      assignUploadedPhotos(uploaded);
      const missing = Math.max(0, 3 - uploaded.length);
      setNotice(
        `${uploaded.length} unique photo${uploaded.length === 1 ? "" : "s"} uploaded. The first 3 fill the ribbon, statement, and keepsake; extra photos are split between Memories and the Photo Wall without reusing an upload.${skippedDuplicates ? ` Skipped ${skippedDuplicates} exact duplicate file${skippedDuplicates === 1 ? "" : "s"}.` : ""}${missing ? ` Add ${missing} more distinct photo${missing === 1 ? "" : "s"} to fill every dedicated photo slot.` : ""} Select Save changes to publish.`,
      );
    } catch (error) {
      if (uploaded.length) assignUploadedPhotos(uploaded);
      setNotice(
        `${uploaded.length} photo${uploaded.length === 1 ? "" : "s"} uploaded and assigned so far. ${error instanceof Error ? error.message : "The next upload failed."}${uploaded.length ? " Select Save changes to publish them." : ""}`,
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
    <div
      className="mx-auto max-w-5xl px-4 py-6 sm:px-8"
      style={paletteCssVariables(draft.palette) as unknown as CSSProperties}
    >
      <header className="sticky top-0 z-10 -mx-4 mb-6 flex items-center justify-between gap-3 border-b bg-cream/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div>
          <h1 className="text-xl font-black text-forest-deep">Birthday site editor</h1>
          <p className="text-xs text-slate-600">Changes save to MongoDB.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" className={buttonClass} onClick={loadTemplate}>
            Load clean template
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={save}
            className="rounded-lg bg-forest px-5 py-2.5 text-sm font-bold text-white hover:bg-forest-deep disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </header>
      {notice && (
        <p role="status" className="mb-4 rounded-lg bg-mint p-3 text-sm text-forest-deep">
          {notice}
        </p>
      )}
      <details className="mb-3 rounded-xl border bg-cream p-3">
        <summary className="cursor-pointer font-semibold text-forest-deep">
          Manage wishes submitted by visitors
        </summary>
        <BirthdayWishManager token={token} />
      </details>
      <details className="mb-6 rounded-xl border bg-cream p-3">
        <summary className="cursor-pointer font-semibold text-forest-deep">
          Deployment details
        </summary>
        <RenderDeploymentInfo token={token} />
      </details>
      <section className="mb-6 rounded-2xl border border-forest/15 bg-cream p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-forest-deep">Color palette</h2>
        <p className="mt-1 text-sm text-forest/80">
          Choose a ready-made palette or adjust each color. The preview updates here; Save changes
          stores it in MongoDB for the birthday page, admin, and wish page.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {PALETTE_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => onChange(["palette"], structuredClone(preset.palette))}
              className="flex items-center gap-2 rounded-full border border-forest/20 bg-cream px-3 py-2 text-sm font-semibold text-forest-deep hover:border-jade"
            >
              <span className="flex overflow-hidden rounded-full">
                {["forest", "mint", "gold", "cream"].map((key) => (
                  <span
                    key={key}
                    className="h-4 w-4"
                    style={{ backgroundColor: preset.palette[key as keyof ColorPalette] }}
                  />
                ))}
              </span>
              {preset.name}
            </button>
          ))}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PALETTE_KEYS.map((key) => (
            <label
              key={key}
              className="flex items-center justify-between gap-3 rounded-xl border border-forest/10 bg-cream px-3 py-2 text-sm font-semibold capitalize text-forest-deep"
            >
              <span>{key.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)}</span>
              <input
                type="color"
                value={draft.palette[key]}
                onChange={(event) => onChange(["palette", key], event.currentTarget.value)}
                aria-label={`${key} palette color`}
                className="h-9 w-12 cursor-pointer rounded border-0 bg-transparent p-0"
              />
            </label>
          ))}
        </div>
      </section>
      <section className="mb-6 rounded-2xl border bg-cream p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-slate-900">Birthday page content</h2>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-sm text-slate-600">
            Edit the birthday text and photos. Each section has a short guide; text and lists can be
            left blank. Changes go live when saved.
          </p>
        </div>
        <div className="mt-4 rounded-xl border border-dashed border-forest/40 bg-mint p-4">
          <label htmlFor="bulk-photo-upload" className="block font-bold text-forest-deep">
            Bulk upload and assign photos
          </label>
          <p className="mt-1 text-sm text-slate-700">
            Select multiple JPG, PNG, WebP, or GIF files (8 MB max each). Three different photos
            fill the ribbon photo, statement photo, and keepsake photo. Any extras are randomly distributed
            between the Photo Wall and Memories, with each uploaded image used once. Exact duplicate
            files in the batch are skipped. You can still replace or edit every image below.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              id="bulk-photo-upload"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={bulkBusy || clearingWall}
              onChange={uploadPhotoBatch}
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
            {(() => {
              const slots = [draft.ribbon.photo, draft.statement.photo, draft.keepsake.photo, ...draft.memories.photos, ...draft.wall.photos];
              const assigned = slots.flatMap((photo) => (photo.id ? [photo.id] : []));
              const unique = new Set(assigned).size;
              const repeats = assigned.length - unique;
              return `${slots.length} image holders total; ${assigned.length} filled with ${unique} distinct photo${unique === 1 ? "" : "s"}${repeats ? ` (${repeats} repeated assignment${repeats === 1 ? "" : "s"})` : ""}. Upload ${slots.length} distinct photos to give every current holder a different image. Individual photo uploads below remain available.`;
            })()}
          </p>
        </div>
        {sections.map((key) => (
          <details
            key={key}
            className="mt-4 rounded-xl border border-slate-200 p-3"
            open={key === "name" || key === "hero"}
          >
            <summary className="cursor-pointer font-bold text-forest-deep">
              {SECTION_LABELS[key] ?? key}
            </summary>
            {key === "keepsake" && (
              <p className="mt-2 text-sm text-slate-600">
                Edit the poem shown on the birthday keepsake card below, or leave it blank. Select
                Save changes to publish.
              </p>
            )}
            {key === "letter" && (
              <p className="mt-2 text-sm text-slate-600">
                Edit the text shown in the “To My Forever Kid” letter, including its heading,
                description, message paragraphs, and sign-off. Save changes to publish.
              </p>
            )}
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
    </div>
  );
}
