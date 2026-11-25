import { createFileRoute } from "@tanstack/react-router";
import { issueBirthdayAccessToken, verifyBirthdayPasscode } from "@/lib/birthday-access.server";
import { hasSameRequestOrigin } from "@/lib/request-origin.server";

export const Route = createFileRoute("/api/birthday-access")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!hasSameRequestOrigin(request))
          return Response.json({ error: "Request origin was not accepted." }, { status: 403 });
        const secret = process.env["BIRTHDAY_ACCESS_SECRET"];
        if (!secret || !process.env["BIRTHDAY_PASSCODE"])
          return Response.json({ error: "Passcode access isn’t configured." }, { status: 503 });
        let passcode: unknown;
        try {
          passcode = ((await request.json()) as { passcode?: unknown }).passcode;
        } catch {
          return Response.json({ error: "Invalid request." }, { status: 400 });
        }
        if (!verifyBirthdayPasscode(passcode))
          return Response.json(
            { error: "Incorrect passcode." },
            { status: 401, headers: { "cache-control": "no-store" } },
          );
        return Response.json(
          { token: issueBirthdayAccessToken(secret) },
          { headers: { "cache-control": "no-store" } },
        );
      },
    },
  },
});
