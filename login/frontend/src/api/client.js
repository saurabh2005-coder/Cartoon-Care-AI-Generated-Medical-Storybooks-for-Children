/**
 * client.js — All API calls to the FastAPI backend in one place.
 * Updated to include JWT token injection and auth endpoints.
 */

const BASE = "/api";

// ── Helper: makes a fetch call and throws on error ────────────────────────
async function request(path, options = {}) {
  const token = localStorage.getItem("cc_token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { headers, ...options });

  if (res.status === 401) {
    localStorage.removeItem("cc_token");
    localStorage.removeItem("cc_user");
    window.dispatchEvent(new Event("auth:logout"));
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── Auth endpoints ────────────────────────────────────────────────────────

export async function registerUser(data) {
  return request("/auth/register", { method: "POST", body: JSON.stringify(data) });
}

export async function loginUser(data) {
  return request("/auth/login", { method: "POST", body: JSON.stringify(data) });
}

export async function logoutUser() {
  return request("/auth/logout", { method: "POST" });
}

export async function getCurrentUser() {
  return request("/auth/me");
}

export async function getAllUsers() {
  return request("/auth/users");
}

export async function deleteUser(userId) {
  return request(`/auth/users/${userId}`, { method: "DELETE" });
}

// ── Story endpoints ───────────────────────────────────────────────────────

export async function generateStory(data) {
  return request("/stories/generate", { method: "POST", body: JSON.stringify(data) });
}

export async function getStoryStatus(storyId) {
  return request(`/stories/${storyId}/status`);
}

export async function getStory(storyId) {
  return request(`/stories/${storyId}`);
}

export async function getAllStories() {
  return request("/stories/");
}

export async function deleteStory(storyId) {
  return request(`/stories/${storyId}`, { method: "DELETE" });
}

// ── Prompt / metadata endpoints ───────────────────────────────────────────

export async function getDiseases() {
  return request("/prompts/diseases");
}

export async function getLanguages() {
  return request("/prompts/languages");
}
