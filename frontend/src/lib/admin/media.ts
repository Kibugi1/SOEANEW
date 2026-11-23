/** Types and helpers for uploaded photos and documents (API_HANDOFF.md §7c). */

export interface MediaAsset {
  id: string;
  kind: "image" | "document";
  url: string;
  alt_text: string | null;
  original_filename: string;
  mime_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  uploaded_by: { id: string; full_name: string | null } | null;
  created_at: string;
}

export interface MediaUsage {
  type: "partner" | "program" | "story" | "team_profile" | "resource";
  label: string;
  title: string;
  admin_path: string | null;
}

export interface MediaDetail extends MediaAsset {
  in_use: number;
  used_in: MediaUsage[];
}

/** Accepted by the API: JPEG, PNG and WebP images (10 MB), PDF documents (25 MB). */
export const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,application/pdf";

export const needsDescription = (asset: MediaAsset) => asset.kind === "image" && !asset.alt_text?.trim();

/** "820 KB", "1.4 MB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
