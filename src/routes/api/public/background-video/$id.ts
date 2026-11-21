import { createFileRoute } from "@tanstack/react-router";
import { ObjectId, type Binary } from "mongodb";
import { withDb } from "@/lib/mongo.server";

type VideoDoc = { _id: ObjectId; data: Binary; contentType: string; size: number };

/** Public delivery for the optional background clip, including browser video range requests. */
export const Route = createFileRoute("/api/public/background-video/$id")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        if (!/^[a-f0-9]{24}$/.test(params.id)) return new Response("Not found", { status: 404 });
        try {
          const doc = await withDb((db) =>
            db.collection<VideoDoc>("background_videos").findOne({ _id: ObjectId.createFromHexString(params.id) }),
          );
          if (!doc) return new Response("Not found", { status: 404 });

          const bytes = doc.data.buffer;
          const size = bytes.byteLength;
          const range = request.headers.get("range");
          let start = 0;
          let end = size - 1;
          let partial = false;
          if (range) {
            const match = /^bytes=(\d*)-(\d*)$/.exec(range);
            if (!match || (!match[1] && !match[2])) {
              return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
            }
            if (!match[1]) {
              const suffixLength = Number(match[2]);
              start = Math.max(0, size - suffixLength);
            } else {
              start = Number(match[1]);
              if (match[2]) end = Math.min(Number(match[2]), end);
            }
            if (start >= size || start > end) {
              return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
            }
            partial = true;
          }

          const body = new Uint8Array(end - start + 1);
          body.set(bytes.subarray(start, end + 1));
          return new Response(body.buffer as ArrayBuffer, {
            status: partial ? 206 : 200,
            headers: {
              "content-type": doc.contentType,
              "content-length": String(body.byteLength),
              "accept-ranges": "bytes",
              ...(partial ? { "content-range": `bytes ${start}-${end}/${size}` } : {}),
              "cache-control": "public, max-age=31536000, immutable",
            },
          });
        } catch (error) {
          console.error(error);
          return new Response("Video unavailable", { status: 503, headers: { "cache-control": "no-store" } });
        }
      },
    },
  },
});
