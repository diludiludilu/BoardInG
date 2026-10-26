// Browser requests use Vite's /api proxy in development and same-origin /api in production.
let csrfToken = null;
let csrfRequest = null;
async function loadCsrf() {
  if (csrfToken) return csrfToken;
  if (!csrfRequest) {
    csrfRequest = fetch("/api/auth/csrf-token", { credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Could not initialize security token (HTTP ${response.status})`);
        const data = await response.json();
        if (!data.csrfToken) throw new Error("Backend did not return a security token");
        csrfToken = data.csrfToken;
        return csrfToken;
      })
      .finally(() => { csrfRequest = null; });
  }
  return csrfRequest;
}

export async function api(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const isWrite = !["GET", "HEAD", "OPTIONS"].includes(method);
  if (isWrite) await loadCsrf();
  const request = async () => fetch(`/api${path}`, {
    ...options, method, credentials: "same-origin",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(isWrite ? { "X-CSRF-Token": csrfToken } : {}),
      ...(options.headers || {}),
    },
  });
  let response = await request();
  // The session can expire in another tab; refresh the token once and retry a rejected write.
  if (isWrite && response.status === 403) {
    const body = await response.clone().json().catch(() => ({}));
    if (body.message === "Invalid security token") {
      csrfToken = null;
      await loadCsrf();
      response = await request();
    }
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Request failed (HTTP ${response.status})`);
  if (data.csrfToken) csrfToken = data.csrfToken;
  if (path === "/auth/logout") csrfToken = null;
  return data;
}
