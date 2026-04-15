export const EDU_BASE = "";

/**
 * Resolve an Educative asset path. Without a proxy configured, external URLs
 * are returned as-is; relative paths pass through unchanged.
 */
export function resolveEduUrl(path: string): string {
  if (!path) return "";
  return path;
}
