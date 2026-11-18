const ADMIN_PATH_PREFIX = "/admin";
const ADMIN_REALM = 'Basic realm="Babs Admin Protected Area"';

function constantTimeEqual(actual, expected) {
  let difference = actual.length ^ expected.length;
  const length = Math.max(actual.length, expected.length);

  for (let index = 0; index < length; index += 1) {
    difference |= (actual.charCodeAt(index) || 0) ^ (expected.charCodeAt(index) || 0);
  }

  return difference === 0;
}

function hasValidCredentials(request, env) {
  if (typeof env.ADMIN_USER !== "string" || typeof env.ADMIN_PASS !== "string") {
    return false;
  }

  const authorization = request.headers.get("Authorization");
  const match = authorization && authorization.match(/^Basic\s+([^\s]+)$/i);
  if (!match) return false;

  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(
      Uint8Array.from(atob(match[1]), (character) => character.charCodeAt(0)),
    );
    const separator = decoded.indexOf(":");
    if (separator < 0) return false;

    const username = decoded.slice(0, separator);
    const password = decoded.slice(separator + 1);
    return (
      constantTimeEqual(username, env.ADMIN_USER) &&
      constantTimeEqual(password, env.ADMIN_PASS)
    );
  } catch {
    // Reject malformed Base64 or invalid UTF-8 credentials.
    return false;
  }
}

function addSecurityHeaders(response, isAdminPath) {
  const headers = new Headers(response.headers);
  headers.set("X-Frame-Options", isAdminPath ? "SAMEORIGIN" : "DENY");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isAdminPath = url.pathname.startsWith(ADMIN_PATH_PREFIX);

    if (isAdminPath && !hasValidCredentials(request, env)) {
      return addSecurityHeaders(
        new Response("Authentication required", {
          status: 401,
          headers: { "WWW-Authenticate": ADMIN_REALM },
        }),
        true,
      );
    }

    // The Basic credentials are only for this Worker gate; do not expose them to the origin.
    const originRequest = isAdminPath ? new Request(request) : request;
    if (isAdminPath) originRequest.headers.delete("Authorization");

    const response = await fetch(originRequest);
    return addSecurityHeaders(response, isAdminPath);
  },
};
