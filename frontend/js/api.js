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

  let response;
  try {
    response = await fetch(path, {
      ...options,
      method,
      headers,
      credentials: "same-origin",
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "TravelX cannot reach its server. From the project folder, run `python -m backend.app` and keep that terminal open, then reload this page."
      );
    }
    throw error;
  }
  let result;
  try {
    result = await response.json();
  } catch (error) {
    if (response.status === 403) {
      throw new Error(
        "The request was blocked (403) by a server that did not return TravelX's API response. Start TravelX with `python -m backend.app` and open the address it prints (by default, http://127.0.0.1:3000), not a static-file server."
      );
    }
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
