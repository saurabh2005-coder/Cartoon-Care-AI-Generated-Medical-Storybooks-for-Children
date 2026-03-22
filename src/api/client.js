/**
 * client.js — All API calls to the FastAPI backend in one place.
 *
 * Why centralize API calls?
 *   - If the backend URL changes, we change it in ONE place
 *   - Every component imports from here instead of writing fetch() everywhere
 *   - Easy to add auth headers, error handling, etc. later
 *
 * The Vite proxy (vite.config.js) forwards /api/* → http://localhost:8000/*
 * So we write "/api/stories/generate" and it hits our FastAPI backend.
 */

const BASE = "/api";

// ── Helper: makes a fetch call and throws on error ────────────────────────
async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  // 204 No Content has no body
  if (res.status === 204) return null;
  return res.json();
}

// ── Story endpoints ───────────────────────────────────────────────────────

/** Start generating a new storybook. Returns { story_id, status, message } */
export async function generateStory(data) {
  return request("/stories/generate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Get a story's current status. Returns { story_id, status, pdf_path, pages_generated } */
export async function getStoryStatus(storyId) {
  return request(`/stories/${storyId}/status`);
}

/** Get the full story with all pages. Returns StoryResponse */
export async function getStory(storyId) {
  return request(`/stories/${storyId}`);
}

/** Get all stories (library). Returns array of StoryListItem */
export async function getAllStories() {
  return request("/stories/");
}

/** Delete a story */
export async function deleteStory(storyId) {
  return request(`/stories/${storyId}`, { method: "DELETE" });
}

// ── Prompt / metadata endpoints ───────────────────────────────────────────

/** Get supported diseases list */
export async function getDiseases() {
  return request("/prompts/diseases");
}

/** Get supported languages list */
export async function getLanguages() {
  return request("/prompts/languages");
}
