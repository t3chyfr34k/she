/**
 * Validate browser POST origins while accounting for the public origin forwarded
 * by a trusted hosting proxy (for example, Render terminating HTTPS upstream).
 */
export function hasSameRequestOrigin(request: Request): boolean {
  const originHeader = request.headers.get("origin");
  if (!originHeader) return true;

  try {
    const origin = new URL(originHeader);
    if (origin.protocol !== "https:" && origin.protocol !== "http:") return false;

    const requestUrl = new URL(request.url);
    if (origin.origin === requestUrl.origin) return true;

    const forwardedHost = request.headers
      .get("x-forwarded-host")
      ?.split(",")[0]
      ?.trim()
      .toLowerCase();
    const host = request.headers.get("host")?.split(",")[0]?.trim().toLowerCase();
    const forwardedProto = request.headers
      .get("x-forwarded-proto")
      ?.split(",")[0]
      ?.trim()
      .toLowerCase();

    // The proxy's forwarded host/proto describe the origin seen by the browser;
    // request.url can instead contain the private app host and HTTP protocol.
    const requestProtocol = requestUrl.protocol.replace(":", "");
    const expectedOrigins = new Set([requestUrl.origin]);
    if (typeof process !== "undefined") {
      const renderExternalUrl = process.env["RENDER_EXTERNAL_URL"];
      if (renderExternalUrl) {
        try {
          expectedOrigins.add(new URL(renderExternalUrl).origin);
        } catch {
          // Ignore a malformed host configuration and rely on request headers.
        }
      }
      const renderHostname = process.env["RENDER_EXTERNAL_HOSTNAME"];
      if (renderHostname) expectedOrigins.add(`https://${renderHostname.toLowerCase()}`);
    }
    if (forwardedHost && forwardedProto) {
      expectedOrigins.add(`${forwardedProto}://${forwardedHost}`);
    } else if (forwardedHost) {
      expectedOrigins.add(`${requestProtocol}://${forwardedHost}`);
    }
    if (host && forwardedProto) {
      expectedOrigins.add(`${forwardedProto}://${host}`);
    } else if (host) {
      expectedOrigins.add(`${requestProtocol}://${host}`);
    }
    return expectedOrigins.has(origin.origin);
  } catch {
    return false;
  }
}
