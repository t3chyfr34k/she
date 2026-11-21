import { createFileRoute } from "@tanstack/react-router";
import { ObjectId, type Binary } from "mongodb";
import { PHOTO_COLLECTION, withDb } from "@/lib/mongo.server";

// Public photo delivery straight from MongoDB. Photos are only ever added with a new id,
// so each URL's bytes never change and can be cached for a long time.
export const Route = createFileRoute("/api/public/photos/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        if (!/^[a-f0-9]{24}$/.test(params.id)) return new Response("Not found", { status: 404 });
        try {
          const doc = await withDb((db) =>
            db
              .collection<{ _id: ObjectId; data: Binary; contentType: string }>(PHOTO_COLLECTION)
              .findOne({ _id: ObjectId.createFromHexString(params.id) }),
          );
          if (!doc) return new Response("Not found", { status: 404 });
          const bytes = doc.data.buffer;
          // MongoDB Binary.buffer may be a view into a larger pooled ArrayBuffer.
          // Sending that backing buffer includes unrelated prefix/suffix bytes, which
          // makes otherwise valid JPEGs fail to decode in browsers.
          const body = new Uint8Array(bytes.byteLength);
          body.set(bytes);
          return new Response(body.buffer as ArrayBuffer, {
            headers: {
              "content-type": doc.contentType,
              "cache-control": "public, max-age=31536000, immutable",
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
