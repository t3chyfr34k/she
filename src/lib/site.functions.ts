import { createServerFn } from "@tanstack/react-start";
import { createHash } from "node:crypto";
import { z } from "zod";
import { Binary, ObjectId } from "mongodb";
import {
  DEFAULT_CONTENT,
  MAX_WALL_PHOTOS,
  normalizeContent,
  referencedPhotoIds,
  siteContentSchema,
  type Photo,
  type SiteContent,
} from "./site-content";
import {
  CONTENT_COLLECTION,
  CONTENT_DOC_ID,
  DbNotConfiguredError,
  PHOTO_COLLECTION,
  withDb,
} from "./mongo.server";
import { passwordMatches, signAdminToken, verifyAdminToken } from "./admin-token.server";
import { hasBirthdayAccess } from "./birthday-access.server";

export type StoreStatus = "ok" | "not-configured" | "error";
export type BirthdayWishSummary = {
  id: string;
  name: string;
  message: string;
  photoUrl: string;
  videoUrl: string | null;
  createdAt: string;
};
type ContentDoc = { _id: string; content: unknown; updatedAt: Date };
type PhotoDoc = {
  _id: ObjectId;
  data: Binary;
  contentType: string;
  w: number;
  h: number;
  size: number;
  sha256: string;
  createdAt: Date;
};
type PhotoIndexDoc = { _id: ObjectId; w: number; h: number; sha256?: string; createdAt: Date };
type BackgroundVideoDoc = {
  _id: ObjectId;
  data: Binary;
  contentType: string;
  size: number;
  createdAt: Date;
};
type BirthdayAudioDoc = {
  _id: ObjectId;
  data: Binary;
  contentType: "audio/mpeg";
  size: number;
  createdAt: Date;
};
type PhotoWallStateDoc = { _id: string; photoWallClearedAt?: Date };
type BirthdayWishDoc = {
  _id: ObjectId;
  name: string;
  message: string;
  photoId: ObjectId;
  videoId: ObjectId | null;
  createdAt: Date;
};
type BirthdayWishMediaIndexDoc = { _id: ObjectId; kind: "photo" | "video" };

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BACKGROUND_VIDEO_BYTES = 12 * 1024 * 1024;
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg"];
const MAX_BIRTHDAY_AUDIO_BYTES = 15 * 1024 * 1024;

function requireAdmin(token: unknown) {
  if (!verifyAdminToken(token, process.env["SESSION_SECRET"])) {
    throw new Error("Your admin pass has expired. Unlock the editor again.");
  }
}

function friendly(error: unknown): string {
  if (error instanceof DbNotConfiguredError) return error.message;
  console.error(error);
  return "Couldn't reach MongoDB. Check the connection string and that the database allows connections from anywhere.";
}

/** Public: initialize the MongoDB document on first visit, then always read the saved document. */
export const getSiteContent = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ token: z.string().max(300) }).parse(d))
  .handler(
    async ({
      data,
    }): Promise<{ content: SiteContent; status: StoreStatus; updatedAt: string | null }> => {
      if (
        !hasBirthdayAccess(data.token) &&
        !verifyAdminToken(data.token, process.env["SESSION_SECRET"])
      )
        throw new Error("Enter the birthday passcode to view this page.");
      const { doc, photoRecords, photoWallClearedAt } = await withDb(async (db) => {
        const collection = db.collection<ContentDoc>(CONTENT_COLLECTION);
        await collection.updateOne(
          { _id: CONTENT_DOC_ID },
          { $setOnInsert: { content: DEFAULT_CONTENT, updatedAt: new Date() } },
          { upsert: true },
        );
        const [site, photos, wallState] = await Promise.all([
          collection.findOne({ _id: CONTENT_DOC_ID }),
          db
            .collection<PhotoIndexDoc>(PHOTO_COLLECTION)
            .find({}, { projection: { _id: 1, w: 1, h: 1, sha256: 1, createdAt: 1 } })
            .sort({ createdAt: 1, _id: 1 })
            .toArray(),
          db.collection<PhotoWallStateDoc>("site_settings").findOne({ _id: "site" }),
        ]);
        return {
          doc: site,
          photoRecords: photos,
          photoWallClearedAt: wallState?.photoWallClearedAt,
        };
      });
      if (!doc) throw new Error("MongoDB did not return the site content document.");
      const content = normalizeContent(doc.content);
      const linkedIds = new Set(referencedPhotoIds(content));
      const linkedHashes = new Set(
        photoRecords
          .filter((photo) => linkedIds.has(photo._id.toHexString()) && photo.sha256)
          .map((photo) => photo.sha256!),
      );
      let changed = false;
      for (const record of photoRecords) {
        const id = record._id.toHexString();
        if (linkedIds.has(id) || (record.sha256 && linkedHashes.has(record.sha256))) continue;
        if (photoWallClearedAt && record.createdAt <= photoWallClearedAt) continue;
        if (content.wall.photos.length >= MAX_WALL_PHOTOS) break;
        const photo: Photo = {
          id,
          w: record.w,
          h: record.h,
          alt: `Birthday memory ${content.wall.photos.length + 1}`,
          caption: "",
          shape:
            record.w / Math.max(record.h, 1) > 1.22
              ? "landscape"
              : record.w / Math.max(record.h, 1) < 0.78
                ? "tall"
                : "square",
        };
        content.wall.photos.push(photo);
        linkedIds.add(id);
        if (record.sha256) linkedHashes.add(record.sha256);
        changed = true;
      }
      for (let index = 0; index < content.memories.photos.length; index++) {
        if (!content.memories.photos[index]?.id && content.wall.photos[index]?.id) {
          content.memories.photos[index] = {
            ...content.wall.photos[index]!,
            alt: content.memories.photos[index]?.alt || `Birthday memory ${index + 1}`,
          };
          changed = true;
        }
      }
      if (!content.ribbon.photo.id && content.wall.photos[3]?.id) {
        content.ribbon.photo = {
          ...content.wall.photos[3]!,
          alt: content.ribbon.photo.alt || "A birthday memory",
        };
        changed = true;
      }
      if (!content.statement.photo.id && content.wall.photos[4]?.id) {
        content.statement.photo = {
          ...content.wall.photos[4]!,
          alt: content.statement.photo.alt || "Another birthday memory",
        };
        changed = true;
      }
      if (changed) {
        await withDb((db) =>
          db
            .collection<ContentDoc>(CONTENT_COLLECTION)
            .updateOne(
              { _id: CONTENT_DOC_ID, updatedAt: doc.updatedAt },
              { $set: { content, updatedAt: new Date() } },
            )
            .then(() => undefined),
        );
      }
      return {
        content,
        status: "ok",
        updatedAt: doc.updatedAt?.toISOString() ?? null,
      };
    },
  );

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ password: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const expected = process.env["ADMIN_PASSWORD"];
    const secret = process.env["SESSION_SECRET"];
    if (!expected || !secret) return { ok: false as const, reason: "not-configured" as const };
    if (!passwordMatches(data.password, expected)) {
      await new Promise((r) => setTimeout(r, 600)); // slow down guessing
      return { ok: false as const, reason: "wrong" as const };
    }
    return { ok: true as const, token: signAdminToken(secret) };
  });

export const checkAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().max(200) }).parse(d))
  .handler(async ({ data }) => ({
    ok: verifyAdminToken(data.token, process.env["SESSION_SECRET"]),
  }));

/** Return only Render's non-secret deployment metadata to an authenticated admin. */
export const getRenderDeploymentInfo = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().max(200) }).parse(d))
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const env = process.env;
    if (env["RENDER"] !== "true") return { available: false as const };

    const value = (key: string) => env[key]?.trim().slice(0, 300) || null;
    const externalUrl = value("RENDER_EXTERNAL_URL");
    const safeUrl = externalUrl && /^https:\/\//i.test(externalUrl) ? externalUrl : null;
    return {
      available: true as const,
      service: value("RENDER_SERVICE_NAME"),
      repo: value("RENDER_GIT_REPO_SLUG"),
      branch: value("RENDER_GIT_BRANCH"),
      commit: value("RENDER_GIT_COMMIT"),
      url: safeUrl,
    };
  });

export const saveSiteContent = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ token: z.string().max(200), content: siteContentSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const content = normalizeContent(data.content);
    const updatedAt = new Date();
    try {
      await withDb(async (db) => {
        await db
          .collection<ContentDoc>(CONTENT_COLLECTION)
          .updateOne({ _id: CONTENT_DOC_ID }, { $set: { content, updatedAt } }, { upsert: true });
        // Tidy up photos no longer used anywhere (recent uploads are kept in case they're mid-edit).
        const keep = referencedPhotoIds(content).map((id) => ObjectId.createFromHexString(id));
        await db.collection<PhotoDoc>(PHOTO_COLLECTION).deleteMany({
          _id: { $nin: keep },
          createdAt: { $lt: new Date(Date.now() - 6 * 60 * 60 * 1000) },
        });
        const videoId = content.backgroundVideo.id
          ? ObjectId.createFromHexString(content.backgroundVideo.id)
          : null;
        await db.collection<BackgroundVideoDoc>("background_videos").deleteMany({
          ...(videoId ? { _id: { $ne: videoId } } : {}),
          createdAt: { $lt: new Date(Date.now() - 6 * 60 * 60 * 1000) },
        });
        const audioId = content.birthdayAudio.id
          ? ObjectId.createFromHexString(content.birthdayAudio.id)
          : null;
        await db.collection<BirthdayAudioDoc>("birthday_audio").deleteMany({
          ...(audioId ? { _id: { $ne: audioId } } : {}),
          createdAt: { $lt: new Date(Date.now() - 6 * 60 * 60 * 1000) },
        });
      });
    } catch (error) {
      throw new Error(friendly(error));
    }
    return { content, updatedAt: updatedAt.toISOString() };
  });

/** Admin: clear the photo wall, deleting photo files not used by the other page sections. */
export const clearPhotoWall = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().max(200) }).parse(d))
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    try {
      return await withDb(async (db) => {
        const stateCollection = db.collection<PhotoWallStateDoc>("site_settings");
        const clearedAt = new Date();
        await stateCollection.updateOne(
          { _id: "site" },
          { $set: { photoWallClearedAt: clearedAt } },
          { upsert: true },
        );
        const collection = db.collection<ContentDoc>(CONTENT_COLLECTION);
        const doc = await collection.findOne({ _id: CONTENT_DOC_ID });
        if (!doc) throw new Error("Site content is missing.");
        const content = normalizeContent(doc.content);
        content.wall.photos = [];
        const updatedAt = new Date();
        await collection.updateOne({ _id: CONTENT_DOC_ID }, { $set: { content, updatedAt } });

        const keepIds = [
          content.ribbon.photo,
          content.statement.photo,
          content.keepsake.photo,
          ...content.memories.photos,
        ].flatMap((photo) =>
          photo.id && /^[a-f0-9]{24}$/.test(photo.id)
            ? [ObjectId.createFromHexString(photo.id)]
            : [],
        );
        await db.collection<PhotoDoc>(PHOTO_COLLECTION).deleteMany({ _id: { $nin: keepIds } });
        return { content, updatedAt: updatedAt.toISOString() };
      });
    } catch (error) {
      throw new Error(friendly(error));
    }
  });

/** Admin: remove the current background clip from both site content and MongoDB. */
export const removeBackgroundVideo = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().max(200) }).parse(d))
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    try {
      return await withDb(async (db) => {
        const collection = db.collection<ContentDoc>(CONTENT_COLLECTION);
        const doc = await collection.findOne({ _id: CONTENT_DOC_ID });
        if (!doc) throw new Error("Site content is missing.");
        const content = normalizeContent(doc.content);
        const oldId = content.backgroundVideo.id;
        content.backgroundVideo = { ...content.backgroundVideo, id: null };
        const updatedAt = new Date();
        await collection.updateOne({ _id: CONTENT_DOC_ID }, { $set: { content, updatedAt } });
        if (oldId && /^[a-f0-9]{24}$/.test(oldId)) {
          await db
            .collection<BackgroundVideoDoc>("background_videos")
            .deleteOne({ _id: ObjectId.createFromHexString(oldId) });
        }
        return { content, updatedAt: updatedAt.toISOString() };
      });
    } catch (error) {
      throw new Error(friendly(error));
    }
  });

/** Admin: upload a short, compressed background clip to MongoDB. */
export const uploadBackgroundVideo = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => {
    if (!(d instanceof FormData)) throw new Error("Expected a background video upload.");
    const file = d.get("file");
    if (!(file instanceof File)) throw new Error("No video was attached.");
    return { token: String(d.get("token") ?? ""), file };
  })
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { file } = data;
    if (!ALLOWED_VIDEO_TYPES.includes(file.type))
      throw new Error("Please upload an MP4, WebM or Ogg video.");
    if (file.size > MAX_BACKGROUND_VIDEO_BYTES)
      throw new Error("That video is too large (max 12 MB). Use a short, compressed looping clip.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    try {
      const id = await withDb(async (db) => {
        const result = await db
          .collection<Omit<BackgroundVideoDoc, "_id">>("background_videos")
          .insertOne({
            data: new Binary(bytes),
            contentType: file.type,
            size: bytes.byteLength,
            createdAt: new Date(),
          });
        return result.insertedId.toHexString();
      });
      return { id };
    } catch (error) {
      throw new Error(friendly(error));
    }
  });

/** Admin: upload the birthday soundtrack to MongoDB. */
export const uploadBirthdayAudio = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => {
    if (!(d instanceof FormData)) throw new Error("Expected an MP3 upload.");
    const file = d.get("file");
    if (!(file instanceof File)) throw new Error("No MP3 was attached.");
    return { token: String(d.get("token") ?? ""), file };
  })
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    if (data.file.type !== "audio/mpeg" || !data.file.name.toLowerCase().endsWith(".mp3"))
      throw new Error("Please upload an MP3 audio file.");
    if (data.file.size > MAX_BIRTHDAY_AUDIO_BYTES)
      throw new Error("That MP3 is too large (max 15 MB).");
    const bytes = new Uint8Array(await data.file.arrayBuffer());
    try {
      const id = await withDb(async (db) => {
        const result = await db
          .collection<Omit<BirthdayAudioDoc, "_id">>("birthday_audio")
          .insertOne({
            data: new Binary(bytes),
            contentType: "audio/mpeg",
            size: bytes.byteLength,
            createdAt: new Date(),
          });
        return result.insertedId.toHexString();
      });
      return { id };
    } catch (error) {
      throw new Error(friendly(error));
    }
  });

/** Admin: remove the configured soundtrack and its MongoDB file. */
export const removeBirthdayAudio = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().max(200) }).parse(d))
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    try {
      return await withDb(async (db) => {
        const collection = db.collection<ContentDoc>(CONTENT_COLLECTION);
        const doc = await collection.findOne({ _id: CONTENT_DOC_ID });
        if (!doc) throw new Error("Site content is missing.");
        const content = normalizeContent(doc.content);
        const oldId = content.birthdayAudio.id;
        content.birthdayAudio = { id: null };
        const updatedAt = new Date();
        await collection.updateOne({ _id: CONTENT_DOC_ID }, { $set: { content, updatedAt } });
        if (oldId && /^[a-f0-9]{24}$/.test(oldId))
          await db
            .collection<BirthdayAudioDoc>("birthday_audio")
            .deleteOne({ _id: ObjectId.createFromHexString(oldId) });
        return { content, updatedAt: updatedAt.toISOString() };
      });
    } catch (error) {
      throw new Error(friendly(error));
    }
  });

export const uploadPhoto = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => {
    if (!(d instanceof FormData)) throw new Error("Expected a photo upload.");
    const file = d.get("file");
    if (!(file instanceof File)) throw new Error("No photo was attached.");
    return {
      token: String(d.get("token") ?? ""),
      file,
      w: Math.max(0, Math.round(Number(d.get("w")) || 0)),
      h: Math.max(0, Math.round(Number(d.get("h")) || 0)),
    };
  })
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { file } = data;
    if (!ALLOWED_TYPES.includes(file.type))
      throw new Error("Please upload a JPG, PNG, WebP or GIF photo.");
    if (file.size > MAX_UPLOAD_BYTES) throw new Error("That photo is too large (max 8 MB).");
    const bytes = new Uint8Array(await file.arrayBuffer());
    try {
      const id = await withDb(async (db) => {
        const res = await db.collection<Omit<PhotoDoc, "_id">>(PHOTO_COLLECTION).insertOne({
          data: new Binary(bytes),
          contentType: file.type,
          w: data.w,
          h: data.h,
          size: bytes.byteLength,
          sha256: createHash("sha256").update(bytes).digest("hex"),
          createdAt: new Date(),
        });
        return res.insertedId.toHexString();
      });
      return { id, w: data.w, h: data.h };
    } catch (error) {
      throw new Error(friendly(error));
    }
  });

/** Protected: return recent wishes for the birthday owner's slideshow. */
export const getBirthdayWishes = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ token: z.string().max(300) }).parse(d))
  .handler(async ({ data }) => {
    if (!hasBirthdayAccess(data.token))
      throw new Error("Enter the birthday passcode to view these wishes.");
    try {
      return await withDb(async (db) => {
        const wishes = await db
          .collection<BirthdayWishDoc>("birthday_wishes")
          .find({}, { projection: { name: 1, message: 1, photoId: 1, videoId: 1, createdAt: 1 } })
          .sort({ createdAt: -1, _id: -1 })
          .limit(60)
          .toArray();
        return wishes.map((wish) => ({
          id: wish._id.toHexString(),
          name: wish.name,
          message: wish.message,
          photoUrl: `/api/public/wish-media/${wish.photoId.toHexString()}`,
          videoUrl: wish.videoId ? `/api/public/wish-media/${wish.videoId.toHexString()}` : null,
          createdAt: wish.createdAt.toISOString(),
        }));
      });
    } catch (error) {
      throw new Error(friendly(error));
    }
  });

/** Admin: list submitted wishes for editing and moderation. */
export const adminListBirthdayWishes = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().max(200) }).parse(d))
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    try {
      return await withDb(async (db) => {
        const wishes = await db
          .collection<BirthdayWishDoc>("birthday_wishes")
          .find({}, { projection: { name: 1, message: 1, photoId: 1, videoId: 1, createdAt: 1 } })
          .sort({ createdAt: -1, _id: -1 })
          .limit(100)
          .toArray();
        return wishes.map((wish) => ({
          id: wish._id.toHexString(),
          name: wish.name,
          message: wish.message,
          photoUrl: `/api/public/wish-media/${wish.photoId.toHexString()}`,
          videoUrl: wish.videoId ? `/api/public/wish-media/${wish.videoId.toHexString()}` : null,
          createdAt: wish.createdAt.toISOString(),
        }));
      });
    } catch (error) {
      throw new Error(friendly(error));
    }
  });

/** Admin: update the displayed name and message for a submitted wish. */
export const adminUpdateBirthdayWish = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        token: z.string().max(200),
        id: z.string().regex(/^[a-f0-9]{24}$/),
        name: z.string().trim().min(1).max(50),
        message: z.string().trim().min(1).max(700),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    try {
      const result = await withDb((db) =>
        db
          .collection<BirthdayWishDoc>("birthday_wishes")
          .updateOne(
            { _id: ObjectId.createFromHexString(data.id) },
            { $set: { name: data.name, message: data.message } },
          ),
      );
      if (!result.matchedCount) throw new Error("That wish no longer exists.");
      return { ok: true as const };
    } catch (error) {
      throw new Error(friendly(error));
    }
  });

/** Admin: remove a submitted wish and its associated uploaded photo/video. */
export const adminDeleteBirthdayWish = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ token: z.string().max(200), id: z.string().regex(/^[a-f0-9]{24}$/) }).parse(d),
  )
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    try {
      return await withDb(async (db) => {
        const wishes = db.collection<BirthdayWishDoc>("birthday_wishes");
        const id = ObjectId.createFromHexString(data.id);
        const wish = await wishes.findOne({ _id: id });
        if (!wish) throw new Error("That wish no longer exists.");
        await wishes.deleteOne({ _id: id });
        const mediaIds = [wish.photoId, wish.videoId].filter(
          (mediaId): mediaId is ObjectId => mediaId instanceof ObjectId,
        );
        if (mediaIds.length)
          await db
            .collection<BirthdayWishMediaIndexDoc>("birthday_wish_media")
            .deleteMany({ _id: { $in: mediaIds } });
        return { ok: true as const };
      });
    } catch (error) {
      throw new Error(friendly(error));
    }
  });
