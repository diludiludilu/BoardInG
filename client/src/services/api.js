
let csrfToken = null;

export async function api(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();

  // Obtain a CSRF token before a write request.
  if (!["GET", "HEAD", "OPTIONS"].includes(method) && !csrfToken) {
    const tokenResponse = await fetch("/api/auth/csrf-token", {
      credentials: "same-origin",
    });

    if (!tokenResponse.ok) {
      throw new Error("Could not initialize security token");
    }

    const tokenData = await tokenResponse.json();
    csrfToken = tokenData.csrfToken;
  }

  const response = await fetch(`/api${path}`, {
    ...options,
    method,
    credentials: "same-origin",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(!["GET", "HEAD", "OPTIONS"].includes(method)
        ? { "X-CSRF-Token": csrfToken }
        : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed: ${response.status}`);
  }

  if (data.csrfToken) {
    csrfToken = data.csrfToken;
  }

  if (path === "/auth/logout") {
    csrfToken = null;
  }

  return data;
}
