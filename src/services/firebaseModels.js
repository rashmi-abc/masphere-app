import { DEFAULT_SETTINGS } from "../data/constants";

export function profileFromDocument(uid, data) {
  return {
    ...data,
    uid,
    pts: data.points ?? data.pts ?? 0,
    interests: Array.isArray(data.interests) ? data.interests : [],
    goals: Array.isArray(data.goals) ? data.goals : [],
    badges: Array.isArray(data.badges) ? data.badges : [],
    stamps: Array.isArray(data.stamps) ? data.stamps : [],
    savedPosts: Array.isArray(data.savedPosts) ? data.savedPosts : [],
    settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) },
  };
}

export function profilePatch(patch) {
  const result = { ...patch };
  if (Object.prototype.hasOwnProperty.call(result, "pts")) {
    result.points = result.pts;
    delete result.pts;
  }
  delete result.uid;
  delete result.email;
  return result;
}

export function timestampDate(value) {
  if (value && typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "number" && Number.isFinite(value)) return new Date(value);
  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

export function relativeTime(value) {
  const date = timestampDate(value);
  if (!date) return "Recently";
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export function commentsForUi(comments) {
  if (!Array.isArray(comments)) return [];
  return comments.map((comment) => Array.isArray(comment)
    ? comment
    : [comment.author || "User", comment.text || ""]);
}
