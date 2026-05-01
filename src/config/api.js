/** Backend origin for REST + Socket.IO (no trailing slash). Set API_BASE_URL at build time in production. */
const raw =
  typeof process !== "undefined" && process.env && process.env.API_BASE_URL
    ? process.env.API_BASE_URL
    : "";

export const API_BASE_URL = (raw || "http://127.0.0.1:5000").replace(/\/$/, "");

export function apiUrl(path) {
  if (path == null || path === "") {
    return API_BASE_URL;
  }
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${p}`;
}
