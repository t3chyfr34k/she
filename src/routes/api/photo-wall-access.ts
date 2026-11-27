import { createFileRoute } from "@tanstack/react-router";
import {
  isPhotoWallProtectionEnabled,
  issuePhotoWallAccessToken,
} from "@/lib/photo-wall-access.server";
import { passwordMatches, verifyAdminToken } from "@/lib/admin-token.server";
import { hasSameRequestOrigin } from "@/lib/request-origin.server";

export const Route = createFileRoute("/api/photo-wall-access")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!hasSameRequestOrigin(request))
          return Response.json({ error: "Request origin was not accepted." }, { status: 403 });
        if (!isPhotoWallProtectionEnabled())
          return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
        const secret = process.env["SESSION_SECRET"];
        if (!secret)
          return Response.json({ error: "Photo Wall access is not configured." }, { status: 503 });
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid request." }, { status: 400 });
        }
        if (!body || typeof body !== "object")
          return Response.json({ error: "Invalid request." }, { status: 400 });
        const credentials = body as { passcode?: unknown; adminToken?: unknown };
        const isAdmin = verifyAdminToken(credentials.adminToken, secret);
        const expected = process.env["PHOTO_WALL_PASSCODE"];
        if (!isAdmin && (!expected || typeof credentials.passcode !== "string" || !passwordMatches(credentials.passcode, expected))) {
          if (expected) await new Promise((resolve) => setTimeout(resolve, 600));
          return Response.json(
            { error: expected ? "That Photo Wall passcode did not match. Try again." : "Photo Wall access is not configured." },
            { status: expected ? 401 : 503, headers: { "cache-control": "no-store" } },
          );
        }
        const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
        return Response.json(
          { ok: true },
          {
            headers: {
              "cache-control": "no-store",
              "set-cookie": `photo_wall_access=${issuePhotoWallAccessToken(secret)}; Path=/api/public/photos/; HttpOnly; SameSite=Strict; Max-Age=1800${secure}`,
            },
          },
        );
      },
    },
  },
});
