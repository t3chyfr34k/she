import { z } from "zod";

/** Shape used for an empty photo holder; once a photo is uploaded its real size wins. */
export const SHAPES = ["portrait", "landscape", "square", "tall", "wide"] as const;
export type Shape = (typeof SHAPES)[number];
export const SHAPE_RATIO: Record<Shape, number> = {
  portrait: 3 / 4,
  landscape: 4 / 3,
  square: 1,
  tall: 9 / 16,
  wide: 16 / 9,
};

export type Photo = {
  /** MongoDB photo id (24 hex chars) or null for an empty holder. */
  id: string | null;
  w: number;
  h: number;
  alt: string;
  caption: string;
  shape: Shape;
};

export type Wish = { title: string; note: string };
export type CustomPage = { slug: string; title: string; body: string };
export type BackgroundVideo = {
  id: string | null;
  opacity: number;
  blendMode: "normal" | "multiply" | "screen" | "overlay" | "soft-light" | "hard-light" | "lighten" | "darken";
  blur: number;
};
export type BirthdayAudio = { id: string | null };

export type SiteContent = {
  name: string;
  hero: { tagline: string; leftWord: string; badge: string; rightWord: string; line1: string; line2: string; sticker: string; hint: string };
  pullTab: { hint: string; label: string; messages: string[] };
  ribbon: { phrase: string; photo: Photo };
  memories: { label: string; bigWord: string; starring: string; edition: string; seal: string; chips: string[]; photos: Photo[] };
  wall: { label: string; title: string; highlight: string; intro: string; photos: Photo[] };
  wishes: { title: string; highlight: string; intro: string; items: Wish[] };
  statement: { heading: string; big: string; coinTop: string; coinBottom: string; note: string; photo: Photo };
  finale: { greeting: string; title: string; highlight: string; message: string; button: string; buttonDone: string; watermark: string; footer: string };
  keepsake: { enabled: boolean; photo: Photo; wish: string; poem: string; signature: string };
  birthdayAudio: BirthdayAudio;
  backgroundVideo: BackgroundVideo;
  pages: CustomPage[];
};

export const MAX_WALL_PHOTOS = 40;
export const MAX_WISHES = 8;
export const MIN_WISHES = 3;
export const MEMORY_PHOTO_COUNT = 3;

export const emptyPhoto = (shape: Shape = "portrait", alt = "", caption = ""): Photo => ({ id: null, w: 0, h: 0, alt, caption, shape });

const WALL_SHAPES: Shape[] = ["portrait", "landscape", "square", "tall", "portrait", "wide", "square", "portrait", "landscape", "tall", "square", "portrait"];

export const DEFAULT_CONTENT: SiteContent = {
  name: "Sireen Nisha",
  hero: {
    tagline: "Innaikku full celebration mode dhaan!",
    leftWord: "Innaikku",
    badge: "B-day",
    rightWord: "unakku dhaan",
    line1: "Happy",
    line2: "Birthday",
    sticker: "for {name} ♥",
    hint: "Cake-a tap pannu, wish kelu",
  },
  pullTab: {
    hint: "Konjam pull pannu pa",
    label: "Inga izhu",
    messages: ["Aha! Secret kandupidichitta!","Innum venuma? Periya aasai dhaan!","Seri, last one… maybe.","Confetti-ku limit-e illa!"],
  },
  ribbon: {
    phrase: "Wish kelu ✦ Candle oothu ✦ Cake saapdu ✦ Dance aadidu ✦ ",
    photo: emptyPhoto("square", "A wrapped birthday gift"),
  },
  memories: {
    label: "Innaikku ivanga dhaan main character",
    bigWord: "One and Only",
    starring: "Heroine",
    edition: "one piece dhaan Adhuvu mendal peice uh , duplicate illa",
    seal: "Scroll for cake ✦ keep going ✦",
    chips: ["Sirichu sirichu vayiru valikkum",],
    photos: [
      emptyPhoto("square", "Birthday cupcake"),
      emptyPhoto("square", "Birthday balloons"),
      emptyPhoto("square", "Birthday cake"),
    ],
  },
  wall: {
    label: "Stolen Pics",
    title: "Namma photo",
    highlight: "wall-u",
    intro: "Unkitta kettu vaangunadhu dhaan; paathutte irukkaadha, keela po!",
    photos: WALL_SHAPES.map((s) => emptyPhoto(s)),
  },
  wishes: {
    title: "Sister",
    highlight: "wishes",
    intro: "",
    items: [
      { title: "Always on your side", note: "Whatever life brings, your brother is one call away—even if he first asks, “What happened?”" },
      { title: "More sibling laughs", note: "May we keep laughing at our silly jokes and stories nobody else understands." },
      { title: "Adventures together", note: "More little trips, unexpected detours, and memories we will tease each other about later." },
      { title: "Your biggest cheerleader", note: "May you chase every dream knowing your brother will always be proud of you." },
      { title: "Fewer silly fights", note: "May our arguments be short, our make-ups quick, and your victory claims only slightly exaggerated." },
      { title: "Cake, always", note: "May your birthday bring extra cake—and may your brother generously let you have the bigger slice." },
    ],
  },
  statement: {
    heading: "Chinna moments-ku\nperiya celebration!",
    big: "Innum oru Chinna level up",
    coinTop: "Level",
    coinBottom: "mass!",
    note: "varusham pogapoga\ncarelessness mattum\nkuraiyala!",
    photo: emptyPhoto("square", "A birthday treat"),
  },
  finale: {
    greeting: "Dear {name}-u,",
    title: "Oru",
    highlight: "wish kelu",
    message: "Kannai moodi oru periya aasai kelu, appuram button-a press pannu.Un responsibility Edhume illa Dhandama suthu!",
    button: "Candle-a oothu",
    buttonDone: "Wish poiduchu ✦ innoru round-aa?",
    watermark: "Semma B-day",
    footer: "Anboda senjadhu",
  },
  keepsake: {
    enabled: true,
    photo: emptyPhoto("portrait", "Birthday portrait"),
    wish: "Un life-la Happiness full-a irukkattum; tension vandha One phone call !",
    poem: "May life always be as kind to you as you've been to the people around you, May you find a reason to smile even on your toughest days. I hope all your dreams find their way to you, And you always have someone to listen, just as you've listened to me.\n\nI'm glad that one random day brought us together, And even happier that a stranger became a sister. No matter where life takes us or how much time passes, You'll always be my kid, and I'll always be cheering for you. ❤️",
    signature: "Dongley oda wishes",
  },
  birthdayAudio: { id: null },
  backgroundVideo: { id: null, opacity: 0.1, blendMode: "soft-light", blur: 2 },
  pages: [],
};

/** Replaces {name} in any text with the birthday person's name. */
export function fillName(text: string, name: string) {
  return text.replaceAll("{name}", name);
}

export const photoUrl = (id: string) => `/api/public/photos/${id}`;

// ---------- validation (used by the server before saving) ----------

const text = (max: number) => z.string().max(max);
export const photoSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{24}$/).nullable(),
  w: z.number().int().min(0).max(40000),
  h: z.number().int().min(0).max(40000),
  alt: text(200),
  caption: text(240),
  shape: z.enum(SHAPES),
});

export const siteContentSchema = z.object({
  name: text(60),
  hero: z.object({ tagline: text(120), leftWord: text(30), badge: text(20), rightWord: text(30), line1: text(16), line2: text(16), sticker: text(80), hint: text(80) }),
  pullTab: z.object({ hint: text(60), label: text(30), messages: z.array(text(60)).max(10) }),
  ribbon: z.object({ phrase: text(200), photo: photoSchema }),
  memories: z.object({
    label: text(80), bigWord: text(20), starring: text(30), edition: text(60), seal: text(60),
    chips: z.array(text(120)).max(8),
    photos: z.array(photoSchema).length(MEMORY_PHOTO_COUNT),
  }),
  wall: z.object({ label: text(60), title: text(30), highlight: text(30), intro: text(300), photos: z.array(photoSchema).max(MAX_WALL_PHOTOS) }),
  wishes: z.object({
    title: text(30), highlight: text(30), intro: text(300),
    items: z.array(z.object({ title: text(30), note: text(200) })).min(MIN_WISHES).max(MAX_WISHES),
  }),
  statement: z.object({ heading: text(120), big: text(60), coinTop: text(14), coinBottom: text(14), note: text(120), photo: photoSchema }),
  finale: z.object({ greeting: text(80), title: text(30), highlight: text(30), message: text(400), button: text(40), buttonDone: text(40), watermark: text(30), footer: text(60) }),
  keepsake: z.object({ enabled: z.boolean(), photo: photoSchema, wish: text(160), poem: text(500), signature: text(50) }),
  birthdayAudio: z.object({ id: z.string().regex(/^[a-f0-9]{24}$/).nullable() }),
  backgroundVideo: z.object({
    id: z.string().regex(/^[a-f0-9]{24}$/).nullable(),
    opacity: z.number().min(0).max(0.6),
    blendMode: z.enum(["normal", "multiply", "screen", "overlay", "soft-light", "hard-light", "lighten", "darken"]),
    blur: z.number().min(0).max(24),
  }),
  pages: z.array(z.object({ slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(60), title: text(80).min(1), body: text(5000) })).max(30),
});

// ---------- normalising stored data ----------

type Json = unknown;

/** Merge stored data onto a default so missing or broken fields fall back safely. */
function mergeInto<T>(fallback: T, raw: Json): T {
  if (fallback === null) {
    return (typeof raw === "string" || raw === null ? raw : fallback) as T;
  }
  if (Array.isArray(fallback)) {
    if (!Array.isArray(raw)) return fallback;
    const template = fallback[0];
    if (template === undefined) return raw as T;
    return raw.map((item, i) => mergeInto(fallback[i] ?? template, item)) as T;
  }
  if (typeof fallback === "object") {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fallback;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(fallback as object)) {
      out[key] = mergeInto((fallback as Record<string, unknown>)[key], (raw as Record<string, unknown>)[key]);
    }
    return out as T;
  }
  return (typeof raw === typeof fallback ? raw : fallback) as T;
}

export function normalizeContent(raw: Json): SiteContent {
  const c = mergeInto(DEFAULT_CONTENT, raw);
  const photos = c.memories.photos.slice(0, MEMORY_PHOTO_COUNT);
  while (photos.length < MEMORY_PHOTO_COUNT) photos.push(DEFAULT_CONTENT.memories.photos[photos.length]!);
  c.memories.photos = photos;
  c.wall.photos = c.wall.photos.slice(0, MAX_WALL_PHOTOS).map((p) => ({ ...p, shape: SHAPES.includes(p.shape) ? p.shape : "portrait" }));
  let items = c.wishes.items.slice(0, MAX_WISHES);
  if (items.length < MIN_WISHES) items = DEFAULT_CONTENT.wishes.items;
  c.wishes.items = items;
  if (!c.name.trim()) c.name = DEFAULT_CONTENT.name;
  return c;
}

/** Every photo id the content points at (used to clean up unused uploads). */
export function referencedPhotoIds(c: SiteContent): string[] {
  const all = [c.ribbon.photo, c.statement.photo, c.keepsake.photo, ...c.memories.photos, ...c.wall.photos];
  return all.flatMap((p) => (p.id ? [p.id] : []));
}
