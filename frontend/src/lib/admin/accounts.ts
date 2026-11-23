/** Types and helpers for dashboard accounts (API_HANDOFF.md §4 and §7a). */

import type { Role } from "@/lib/admin/api";

export interface Account {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  is_active: boolean;
  must_change_password: boolean;
  team_profile: { id: string; slug: string; display_name: string; status: string } | null;
  last_login_at: string | null;
  created_at: string;
}

export interface ProfileOption {
  id: string;
  slug: string;
  display_name: string;
  role_title: string | null;
  status: string;
  linked_account: { id: string; full_name: string | null; email: string } | null;
}

export const ROLE_INFO: Record<Role, { label: string; can: string }> = {
  admin: {
    label: "Admin",
    can: "Everything: approves and publishes stories, programs and partners, and manages accounts.",
  },
  editor: {
    label: "Editor",
    can: "Works the inbox and prepares programs, partners and stories as drafts. Cannot publish or manage accounts.",
  },
  author: {
    label: "Author",
    can: "Writes their own stories and sends them for review. Sees nothing else.",
  },
};

export const MIN_PASSWORD = 12;

/**
 * A temporary password that is easy to read out or type: four groups of four from an
 * alphabet without look-alikes (no 0/O, 1/l/I), e.g. "k7Qm-xR4t-Wp9c-Hn3v".
 */
export function temporaryPassword(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]);
  return [0, 4, 8, 12].map((i) => chars.slice(i, i + 4).join("")).join("-");
}
