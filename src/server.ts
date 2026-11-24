import "./lib/error-capture";

import { consumeLastCapturedError, describeError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;
const serverStartedAt = Date.now();

function getUptimeSeconds(): number {
  // Node deployments expose process.uptime(); keep the same entry compatible with
  // the existing Cloudflare Worker build, where `process` is not available.
  return typeof process !== "undefined" && typeof process.uptime === "function"
    ? Math.floor(process.uptime())
    : Math.floor((Date.now() - serverStartedAt) / 1000);
}

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  const captured = consumeLastCapturedError();
  console.error(captured ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(captured), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function logRequestDiagnostic(details: Record<string, unknown>): void {
  console.error(`[request-diagnostic] ${JSON.stringify(details)}`);
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// Hosting compresses every response at the edge. Never compress a body (gzip, brotli,
// CompressionStream) or set content-encoding here or in a server route: the body gets encoded
// twice and renders garbled.
export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const requestId = crypto.randomUUID();
    const startedAt = Date.now();
    const url = new URL(request.url);
    request.signal.addEventListener("abort", () => {
      logRequestDiagnostic({
        event: "request_aborted",
        requestId,
        method: request.method,
        path: url.pathname,
        elapsedMs: Date.now() - startedAt,
      });
    }, { once: true });

    try {
      if (url.pathname === "/health" && request.method === "GET") {
        return Response.json({
          status: "ok",
          uptime: getUptimeSeconds(),
          timestamp: new Date().toISOString(),
        });
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalizedResponse = await normalizeCatastrophicSsrResponse(response);
      if (normalizedResponse.status >= 500) {
        logRequestDiagnostic({
          event: "request_failed",
          requestId,
          method: request.method,
          path: url.pathname,
          status: normalizedResponse.status,
          elapsedMs: Date.now() - startedAt,
          requestAborted: request.signal.aborted,
        });
      }
      return normalizedResponse;
    } catch (error) {
      logRequestDiagnostic({
        event: "request_exception",
        requestId,
        method: request.method,
        path: url.pathname,
        status: 500,
        elapsedMs: Date.now() - startedAt,
        requestAborted: request.signal.aborted,
        error: describeError(error),
      });
      return new Response(renderErrorPage(error), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
