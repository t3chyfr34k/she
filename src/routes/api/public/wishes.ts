import { createFileRoute } from "@tanstack/react-router";
import { saveBirthdayWish, BirthdayWishValidationError } from "@/lib/birthday-wishes.server";
import { hasSameRequestOrigin } from "@/lib/request-origin.server";

export const Route = createFileRoute("/api/public/wishes")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!hasSameRequestOrigin(request))
          return Response.json({ error: "Request origin was not accepted." }, { status: 403 });
        const contentLength = Number(request.headers.get("content-length") ?? 0);
        if (contentLength > 46 * 1024 * 1024)
          return Response.json({ error: "The upload is too large." }, { status: 413 });
        try {
          const form = await request.formData();
          const result = await saveBirthdayWish(form);
          return Response.json(result, { status: 201, headers: { "cache-control": "no-store" } });
        } catch (error) {
          const isInputError = error instanceof BirthdayWishValidationError;
          console.error(isInputError ? `[birthday-wish] ${error.message}` : error);
          return Response.json(
            {
              error: isInputError ? error.message : "We couldn't save your wish. Please try again.",
            },
            {
              status: isInputError ? 400 : 500,
              headers: { "cache-control": "no-store" },
            },
          );
        }
      },
    },
  },
});
