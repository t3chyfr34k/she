import { createFileRoute } from "@tanstack/react-router";
import { ObjectId, type Binary } from "mongodb";
import { CONTENT_COLLECTION, CONTENT_DOC_ID, PHOTO_COLLECTION, withDb } from "@/lib/mongo.server";
import {
  hasPhotoWallAccess,
  isPhotoWallProtectionEnabled,
} from "@/lib/photo-wall-access.server";

type SitePhotoRefs = {
  _id: string;
  content?: {
    wall?: { photos?: { id?: string | null }[] };
    ribbon?: { photo?: { id?: string | null } };
    statement?: { photo?: { id?: string | null } };
    keepsake?: { photo?: { id?: string | null } };
    memories?: { photos?: { id?: string | null }[] };
  };
};

// Public photo delivery straight from MongoDB. Photos are only ever added with a new id,
// so each URL's bytes never change and can be cached for a long time.
export const Route = createFileRoute("/api/public/photos/$id")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        if (!/^[a-f0-9]{24}$/.test(params.id)) return new Response("Not found", { status: 404 });
        try {
          const photoId = ObjectId.createFromHexString(params.id);
          const cookie = request.headers.get("cookie") ?? "";
          const wallAccessToken = /(?:^|;\s*)photo_wall_access=([^;]+)/.exec(cookie)?.[1];
          const result = await withDb(async (db) => {
            const [doc, site] = await Promise.all([
              db
                .collection<{ _id: ObjectId; data: Binary; contentType: string }>(PHOTO_COLLECTION)
                .findOne({ _id: photoId }),
              db.collection<SitePhotoRefs>(CONTENT_COLLECTION).findOne(
                { _id: CONTENT_DOC_ID },
                {
                  projection: {
                    "content.wall.photos.id": 1,
                    "content.ribbon.photo.id": 1,
                    "content.statement.photo.id": 1,
                    "content.keepsake.photo.id": 1,
                    "content.memories.photos.id": 1,
                  },
                },
              ),
            ]);
            const content = site?.content;
            const isInWall = content?.wall?.photos?.some((photo) => photo.id === params.id) ?? false;
            const isInPublicSection = [
              content?.ribbon?.photo?.id,
              content?.statement?.photo?.id,
              content?.keepsake?.photo?.id,
              ...(content?.memories?.photos ?? []).map((photo) => photo.id),
            ].includes(params.id);
            return {
              doc,
              wallOnly: isPhotoWallProtectionEnabled() && isInWall && !isInPublicSection,
            };
          });
          if (result.wallOnly && !hasPhotoWallAccess(wallAccessToken))
            return new Response("Photo Wall passcode required", {
              status: 401,
              headers: { "cache-control": "private, no-store" },
            });
          if (!result.doc) return new Response("Not found", { status: 404 });
          const { doc } = result;
          const bytes = doc.data.buffer;
          // MongoDB Binary.buffer may be a view into a larger pooled ArrayBuffer.
          // Sending that backing buffer includes unrelated prefix/suffix bytes, which
          // makes otherwise valid JPEGs fail to decode in browsers.
          const body = new Uint8Array(bytes.byteLength);
          body.set(bytes);
          return new Response(body.buffer as ArrayBuffer, {
            headers: {
              "content-type": doc.contentType,
              "cache-control": result.wallOnly
                ? "private, no-store"
                : "public, max-age=31536000, immutable",
            },
          });
        } catch (error) {
          console.error(error);
          return new Response("Photo unavailable", { status: 503, headers: { "cache-control": "no-store" } });
        }
      },
    },
  },
});
