import { Binary, ObjectId } from "mongodb";
import { z } from "zod";
import { withDb } from "./mongo.server";

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];
const AUDIO_TYPES = [
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
];

export class BirthdayWishValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BirthdayWishValidationError";
  }
}

export async function saveBirthdayWish(form: FormData): Promise<{ id: string }> {
  const photo = form.get("photo");
  const video = form.get("video");
  const audio = form.get("audio");
  if (!(photo instanceof File) || photo.size === 0)
    throw new BirthdayWishValidationError("Please add your photo.");
  if (video != null && !(video instanceof File))
    throw new BirthdayWishValidationError("That video upload could not be read.");
  if (audio != null && !(audio instanceof File))
    throw new BirthdayWishValidationError("That audio upload could not be read.");
  const name = z
    .string()
    .trim()
    .min(1, "Please enter your name.")
    .max(50, "Name must be 50 characters or fewer.")
    .safeParse(form.get("name"));
  if (!name.success)
    throw new BirthdayWishValidationError(
      name.error.issues[0]?.message ?? "Please enter your name.",
    );
  const message = z
    .string()
    .trim()
    .min(1, "Please write a birthday wish.")
    .max(700, "Keep your wish under 700 characters.")
    .safeParse(form.get("message"));
  if (!message.success)
    throw new BirthdayWishValidationError(
      message.error.issues[0]?.message ?? "Please write a birthday wish.",
    );
  if (form.get("consent") !== "yes")
    throw new BirthdayWishValidationError(
      "Please confirm that your wish and photo may be shown on the birthday page.",
    );
  const optionalVideo = video instanceof File && video.size > 0 ? video : null;
  const optionalAudio = audio instanceof File && audio.size > 0 ? audio : null;
  if (!PHOTO_TYPES.includes(photo.type))
    throw new BirthdayWishValidationError("Upload a JPG, PNG or WebP photo.");
  if (photo.size > MAX_PHOTO_BYTES)
    throw new BirthdayWishValidationError("Your photo must be 8 MB or smaller.");
  if (optionalVideo && !VIDEO_TYPES.includes(optionalVideo.type))
    throw new BirthdayWishValidationError("Upload an MP4 or WebM video.");
  if (optionalVideo && optionalVideo.size > MAX_VIDEO_BYTES)
    throw new BirthdayWishValidationError("Your video must be 25 MB or smaller.");
  if (optionalAudio && !AUDIO_TYPES.includes(optionalAudio.type.toLowerCase().split(";")[0] ?? ""))
    throw new BirthdayWishValidationError("Upload an MP3, WAV, M4A, OGG or WebM audio file.");
  if (optionalAudio && optionalAudio.size > MAX_AUDIO_BYTES)
    throw new BirthdayWishValidationError("Your audio message must be 10 MB or smaller.");

  const photoBytes = new Uint8Array(await photo.arrayBuffer());
  const videoBytes = optionalVideo ? new Uint8Array(await optionalVideo.arrayBuffer()) : null;
  const audioBytes = optionalAudio ? new Uint8Array(await optionalAudio.arrayBuffer()) : null;
  return withDb(async (db) => {
    const media = db.collection<
      Omit<
        {
          _id: ObjectId;
          data: Binary;
          contentType: string;
          size: number;
          kind: "photo" | "video" | "audio";
          createdAt: Date;
        },
        "_id"
      >
    >("birthday_wish_media");
    let photoId: ObjectId | undefined;
    let videoId: ObjectId | null = null;
    let audioId: ObjectId | null = null;
    try {
      photoId = (
        await media.insertOne({
          data: new Binary(photoBytes),
          contentType: photo.type,
          size: photoBytes.byteLength,
          kind: "photo",
          createdAt: new Date(),
        })
      ).insertedId;
      if (optionalVideo && videoBytes) {
        videoId = (
          await media.insertOne({
            data: new Binary(videoBytes),
            contentType: optionalVideo.type,
            size: videoBytes.byteLength,
            kind: "video",
            createdAt: new Date(),
          })
        ).insertedId;
      }
      if (optionalAudio && audioBytes) {
        audioId = (
          await media.insertOne({
            data: new Binary(audioBytes),
            contentType: optionalAudio.type,
            size: audioBytes.byteLength,
            kind: "audio",
            createdAt: new Date(),
          })
        ).insertedId;
      }
      const wish = await db
        .collection<
          Omit<
            {
              _id: ObjectId;
              name: string;
              message: string;
              photoId: ObjectId;
              videoId: ObjectId | null;
              audioId: ObjectId | null;
              createdAt: Date;
            },
            "_id"
          >
        >("birthday_wishes")
        .insertOne({
          name: name.data,
          message: message.data,
          photoId,
          videoId,
          audioId,
          createdAt: new Date(),
        });
      return { id: wish.insertedId.toHexString() };
    } catch (error) {
      const uploadedIds = [photoId, videoId, audioId].filter(
        (id): id is ObjectId => id !== null && id !== undefined,
      );
      if (uploadedIds.length) await media.deleteMany({ _id: { $in: uploadedIds } });
      throw error;
    }
  });
}
