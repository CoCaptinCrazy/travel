let csrfToken = null;

export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const method = (options.method || "GET").toUpperCase();
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (!["GET", "HEAD", "OPTIONS"].includes(method) && csrfToken && path !== "/api/auth/login" && path !== "/api/auth/register") {
    headers.set("X-CSRF-Token", csrfToken);
  }

  const response = await fetch(path, {
    ...options,
    method,
    headers,
    credentials: "same-origin",
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  let result;
  try {
    result = await response.json();
  } catch (error) {
    throw new Error(`The server returned an unreadable response (${response.status}).`);
  }
  if (!response.ok || !result.ok) {
    throw new Error(result.error || `Request failed (${response.status}).`);
  }
  return result.data;
}

export function setCsrfToken(token) {
  csrfToken = token || null;
}
