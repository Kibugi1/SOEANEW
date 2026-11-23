import type { Role } from "@/lib/admin/api";

export interface AdminNavItem {
  href: string;
  label: string;
  /** Label for authors, whose view is limited to their own work. */
  authorLabel?: string;
  roles: Role[];
  /** False until the screen is built; shown as "Soon" and not linked. */
  ready: boolean;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Home", roles: ["admin", "editor", "author"], ready: true },
  { href: "/admin/inbox", label: "Inbox", roles: ["admin", "editor"], ready: true },
  { href: "/admin/stories", label: "Stories & events", authorLabel: "My stories", roles: ["admin", "editor", "author"], ready: true },
  { href: "/admin/programs", label: "Programs", roles: ["admin", "editor"], ready: true },
  { href: "/admin/partners", label: "Partners", roles: ["admin", "editor"], ready: false },
  { href: "/admin/media", label: "Photos & files", roles: ["admin", "editor", "author"], ready: false },
  { href: "/admin/accounts", label: "Accounts", roles: ["admin"], ready: false },
];

export const navFor = (role: Role) => ADMIN_NAV.filter((item) => item.roles.includes(role));
