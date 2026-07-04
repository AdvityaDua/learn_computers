import { API_BASE_URL } from "./api";

/** Resolves a profile image / upload path returned by the backend into an absolute URL. */
export function resolveAssetUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
