import { createFileRoute } from "@tanstack/react-router";
import { ObjectId, type Binary } from "mongodb";
import { withDb } from "@/lib/mongo.server";

type AudioDoc = { _id: ObjectId; data: Binary; contentType: "audio/mpeg"; size: number };

/** Public MP3 delivery with byte ranges for seeking and looping audio players. */
export const Route = createFileRoute("/api/public/birthday-audio/$id")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        if (!/^[a-f0-9]{24}$/.test(params.id)) return new Response("Not found", { status: 404 });
        try {
          const doc = await withDb((db) => db.collection<AudioDoc>("birthday_audio").findOne({ _id: ObjectId.createFromHexString(params.id) }));
          if (!doc) return new Response("Not found", { status: 404 });
          const bytes = doc.data.buffer;
          const size = bytes.byteLength;
          if (!size) return new Response("Audio unavailable", { status: 503 });
          const range = request.headers.get("range");
          let start = 0;
          let end = size - 1;
          let partial = false;
          if (range) {
            const match = /^bytes=(\d*)-(\d*)$/.exec(range);
            if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
            if (!match[1]) {
              const suffixLength = Number(match[2]);
              if (!suffixLength) return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
              start = Math.max(0, size - suffixLength);
            } else {
              start = Number(match[1]);
              if (match[2]) end = Math.min(Number(match[2]), end);
            }
            if (start >= size || start > end) return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
            partial = true;
          }
          const body = new Uint8Array(end - start + 1);
          body.set(bytes.subarray(start, end + 1));
          return new Response(body.buffer as ArrayBuffer, {
            status: partial ? 206 : 200,
            headers: {
              "content-type": "audio/mpeg",
              "content-length": String(body.byteLength),
              "accept-ranges": "bytes",
              "content-disposition": "inline",
              ...(partial ? { "content-range": `bytes ${start}-${end}/${size}` } : {}),
              "cache-control": "public, max-age=31536000, immutable",
              "x-content-type-options": "nosniff",
            },
          });
        } catch (error) {
          console.error(error);
          return new Response("Audio unavailable", { status: 503, headers: { "cache-control": "no-store" } });
        }
      },
    },
  },
});
