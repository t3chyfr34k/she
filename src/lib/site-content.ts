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
  blendMode:
    | "normal"
    | "multiply"
    | "screen"
    | "overlay"
    | "soft-light"
    | "hard-light"
    | "lighten"
    | "darken";
  blur: number;
};
export type BirthdayAudio = { id: string | null };
export const PALETTE_KEYS = [
  "mint",
  "mintDeep",
  "forest",
  "forestDeep",
  "jade",
  "cream",
  "gold",
  "goldDeep",
  "tape",
] as const;
export type PaletteKey = (typeof PALETTE_KEYS)[number];
export type ColorPalette = Record<PaletteKey, string>;

export const DEFAULT_PALETTE: ColorPalette = {
  mint: "#e9f6f0",
  mintDeep: "#c7e7d9",
  forest: "#245b4c",
  forestDeep: "#17483e",
  jade: "#429d7c",
  cream: "#fffaf3",
  gold: "#f4d06f",
  goldDeep: "#b47c43",
  tape: "#e5d7b6",
};

export const PALETTE_PRESETS: { name: string; palette: ColorPalette }[] = [
  { name: "Garden green", palette: DEFAULT_PALETTE },
  {
    name: "Rose party",
    palette: {
      mint: "#f8e8ee",
      mintDeep: "#edc7d5",
      forest: "#653448",
      forestDeep: "#432232",
      jade: "#bd6d8c",
      cream: "#fff7f5",
      gold: "#f6c76b",
      goldDeep: "#b37a45",
      tape: "#ead5c0",
    },
  },
  {
    name: "Ocean breeze",
    palette: {
      mint: "#e6f5fa",
      mintDeep: "#c4e4ee",
      forest: "#15516b",
      forestDeep: "#103749",
      jade: "#238aa0",
      cream: "#f8fcff",
      gold: "#f5ca67",
      goldDeep: "#bd8138",
      tape: "#d9e4e7",
    },
  },
  {
    name: "Lavender dream",
    palette: {
      mint: "#f0eafb",
      mintDeep: "#d8c9ee",
      forest: "#51416f",
      forestDeep: "#37294f",
      jade: "#8871b5",
      cream: "#fcf9ff",
      gold: "#f2cf79",
      goldDeep: "#ac784b",
      tape: "#e3d9c5",
    },
  },
];

export function paletteCssVariables(palette: ColorPalette): Record<string, string> {
  const tokens = Object.fromEntries(
    PALETTE_KEYS.map((key) => [
      `--${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
      palette[key],
    ]),
  );
  return {
    ...tokens,
    "--background": palette.mint,
    "--foreground": palette.forest,
    "--card": palette.cream,
    "--card-foreground": palette.forest,
    "--popover": palette.cream,
    "--popover-foreground": palette.forest,
    "--primary": palette.forest,
    "--primary-foreground": palette.mint,
    "--secondary": palette.jade,
    "--secondary-foreground": palette.forestDeep,
    "--muted": palette.mintDeep,
    "--muted-foreground": palette.forest,
    "--accent": palette.gold,
    "--accent-foreground": palette.forestDeep,
    "--border": `color-mix(in oklab, ${palette.forest} 24%, transparent)`,
    "--input": `color-mix(in oklab, ${palette.forest} 30%, transparent)`,
    "--ring": palette.jade,
    "--sidebar": palette.cream,
    "--sidebar-foreground": palette.forest,
    "--sidebar-primary": palette.forest,
    "--sidebar-primary-foreground": palette.mint,
    "--sidebar-accent": palette.mint,
    "--sidebar-accent-foreground": palette.forest,
    "--sidebar-border": `color-mix(in oklab, ${palette.forest} 24%, transparent)`,
    "--sidebar-ring": palette.jade,
    "--shadow-sticker-value": `0 2px 0 color-mix(in oklab, ${palette.forestDeep} 25%, transparent), 0 18px 40px -18px color-mix(in oklab, ${palette.forestDeep} 42%, transparent)`,
    "--shadow-lift-value": `10px 12px 0 color-mix(in oklab, ${palette.forestDeep} 25%, transparent)`,
  };
}

export function normalizePalette(raw: unknown): ColorPalette {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const entries = PALETTE_KEYS.map((key) => {
    const value = source[key];
    return [key, typeof value === "string" && /^#[\da-fA-F]{6}$/.test(value) ? value : DEFAULT_PALETTE[key]];
  });
  return Object.fromEntries(entries) as ColorPalette;
}

export type SiteContent = {
  name: string;
  palette: ColorPalette;
  hero: {
    tagline: string;
    leftWord: string;
    badge: string;
    rightWord: string;
    line1: string;
    line2: string;
    sticker: string;
    hint: string;
  };
  pullTab: { hint: string; label: string; messages: string[] };
  ribbon: { phrase: string; photo: Photo };
  memories: {
    label: string;
    bigWord: string;
    starring: string;
    edition: string;
    seal: string;
    chips: string[];
    photos: Photo[];
  };
  wall: { label: string; title: string; highlight: string; intro: string; photos: Photo[] };
  wishes: { title: string; highlight: string; intro: string; items: Wish[] };
  statement: {
    heading: string;
    big: string;
    coinTop: string;
    coinBottom: string;
    note: string;
    photo: Photo;
  };
  finale: {
    greeting: string;
    title: string;
    highlight: string;
    message: string;
    button: string;
    buttonDone: string;
    watermark: string;
    footer: string;
  };
  letter: {
    kicker: string;
    title: string;
    description: string;
    paragraphs: string[];
    signature: string;
  };
  keepsake: { enabled: boolean; photo: Photo; wish: string; poem: string; signature: string };
  birthdayAudio: BirthdayAudio;
  backgroundVideo: BackgroundVideo;
  pages: CustomPage[];
};

export const emptyPhoto = (shape: Shape = "portrait", alt = "", caption = ""): Photo => ({
  id: null,
  w: 0,
  h: 0,
  alt,
  caption,
  shape,
});

export const DEFAULT_CONTENT: SiteContent = {
  name: "Birthday Star",
  palette: DEFAULT_PALETTE,
  hero: {
    tagline: "A day made for celebrating",
    leftWord: "Today",
    badge: "All About",
    rightWord: "You",
    line1: "Happy",
    line2: "Birthday",
    sticker: "for {name} ♥",
    hint: "Tap the cake to celebrate",
  },
  pullTab: {
    hint: "There is a little surprise",
    label: "Pull here",
    messages: ["Wishing you a wonderful birthday!"],
  },
  ribbon: {
    phrase: "Celebrate • Make a wish • Enjoy your day • ",
    photo: emptyPhoto("square", "Add a birthday photo"),
  },
  memories: {
    label: "The star of the day",
    bigWord: "Birthday Star",
    starring: "TODAY'S STAR",
    edition: "Add a short personal tagline here",
    seal: "A day to celebrate •",
    chips: [],
    photos: [],
  },
  wall: {
    label: "MEMORY LANE",
    title: "Photo",
    highlight: "Wall",
    intro: "Add a short invitation for guests to browse the photos.",
    photos: [],
  },
  wishes: {
    title: "Birthday",
    highlight: "Wishes",
    intro: "Add a short introduction for the birthday wishes.",
    items: [],
  },
  statement: {
    heading: "A day full of\nhappy moments",
    big: "Make a wish",
    coinTop: "Make",
    coinBottom: "A Wish",
    note: "Add a short birthday message here.",
    photo: emptyPhoto("square", "Add a celebration photo"),
  },
  finale: {
    greeting: "Dear {name},",
    title: "Make a",
    highlight: "Wish",
    message: "Write a final birthday message here.",
    button: "Make a wish",
    buttonDone: "Wish made!",
    watermark: "Birthday wishes",
    footer: "With love",
  },
  letter: {
    kicker: "A birthday message",
    title: "A Letter for You",
    description: "Add a personal subtitle or leave this blank.",
    paragraphs: [
      "Write a personal birthday message here. Share a favorite memory, what you appreciate about them, and your wishes for the year ahead.",
    ],
    signature: "With love,",
  },
  keepsake: {
    enabled: true,
    photo: emptyPhoto("portrait", "Add a birthday portrait"),
    wish: "Write a short birthday wish here.",
    poem: "Add a personal message for the birthday card here.",
    signature: "Your name",
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

const text = () => z.string();
export const photoSchema = z.object({
  id: z
    .string()
    .regex(/^[a-f0-9]{24}$/)
    .nullable(),
  w: z.number().int().min(0).max(40000),
  h: z.number().int().min(0).max(40000),
  alt: text(),
  caption: text(),
  shape: z.enum(SHAPES),
});

export const siteContentSchema = z.object({
  name: text(),
  palette: z.object({
    mint: z.string().regex(/^#[\da-fA-F]{6}$/),
    mintDeep: z.string().regex(/^#[\da-fA-F]{6}$/),
    forest: z.string().regex(/^#[\da-fA-F]{6}$/),
    forestDeep: z.string().regex(/^#[\da-fA-F]{6}$/),
    jade: z.string().regex(/^#[\da-fA-F]{6}$/),
    cream: z.string().regex(/^#[\da-fA-F]{6}$/),
    gold: z.string().regex(/^#[\da-fA-F]{6}$/),
    goldDeep: z.string().regex(/^#[\da-fA-F]{6}$/),
    tape: z.string().regex(/^#[\da-fA-F]{6}$/),
  }),
  hero: z.object({
    tagline: text(),
    leftWord: text(),
    badge: text(),
    rightWord: text(),
    line1: text(),
    line2: text(),
    sticker: text(),
    hint: text(),
  }),
  pullTab: z.object({ hint: text(), label: text(), messages: z.array(text()) }),
  ribbon: z.object({ phrase: text(), photo: photoSchema }),
  memories: z.object({
    label: text(),
    bigWord: text(),
    starring: text(),
    edition: text(),
    seal: text(),
    chips: z.array(text()),
    photos: z.array(photoSchema),
  }),
  wall: z.object({
    label: text(),
    title: text(),
    highlight: text(),
    intro: text(),
    photos: z.array(photoSchema),
  }),
  wishes: z.object({
    title: text(),
    highlight: text(),
    intro: text(),
    items: z.array(z.object({ title: text(), note: text() })),
  }),
  statement: z.object({
    heading: text(),
    big: text(),
    coinTop: text(),
    coinBottom: text(),
    note: text(),
    photo: photoSchema,
  }),
  finale: z.object({
    greeting: text(),
    title: text(),
    highlight: text(),
    message: text(),
    button: text(),
    buttonDone: text(),
    watermark: text(),
    footer: text(),
  }),
  letter: z.object({
    kicker: text(),
    title: text(),
    description: text(),
    paragraphs: z.array(text()),
    signature: text(),
  }),
  keepsake: z.object({
    enabled: z.boolean(),
    photo: photoSchema,
    wish: text(),
    poem: text(),
    signature: text(),
  }),
  birthdayAudio: z.object({
    id: z
      .string()
      .regex(/^[a-f0-9]{24}$/)
      .nullable(),
  }),
  backgroundVideo: z.object({
    id: z
      .string()
      .regex(/^[a-f0-9]{24}$/)
      .nullable(),
    opacity: z.number().min(0).max(0.6),
    blendMode: z.enum([
      "normal",
      "multiply",
      "screen",
      "overlay",
      "soft-light",
      "hard-light",
      "lighten",
      "darken",
    ]),
    blur: z.number().min(0).max(24),
  }),
  pages: z.array(
    z.object({ slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), title: text(), body: text() }),
  ),
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
      out[key] = mergeInto(
        (fallback as Record<string, unknown>)[key],
        (raw as Record<string, unknown>)[key],
      );
    }
    return out as T;
  }
  return (typeof raw === typeof fallback ? raw : fallback) as T;
}

export function normalizeContent(raw: Json): SiteContent {
  const c = mergeInto(DEFAULT_CONTENT, raw);
  c.palette = normalizePalette(c.palette);
  c.memories.photos = c.memories.photos.map((p) => ({
    ...p,
    shape: SHAPES.includes(p.shape) ? p.shape : "portrait",
  }));
  c.wall.photos = c.wall.photos.map((p) => ({
    ...p,
    shape: SHAPES.includes(p.shape) ? p.shape : "portrait",
  }));
  return c;
}

/** Every photo id the content points at (used to clean up unused uploads). */
export function referencedPhotoIds(c: SiteContent): string[] {
  const all = [
    c.ribbon.photo,
    c.statement.photo,
    c.keepsake.photo,
    ...c.memories.photos,
    ...c.wall.photos,
  ];
  return all.flatMap((p) => (p.id ? [p.id] : []));
}
