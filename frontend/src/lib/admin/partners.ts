/** Types and labels for partners (API_HANDOFF.md §7d). */

import type { ImageValue } from "@/components/admin/ImageField";
import type { PublicationStatus } from "@/lib/admin/programs";

export type PartnerType =
  | "community_organization"
  | "technical_institution"
  | "business"
  | "researcher"
  | "financial_institution"
  | "public_institution"
  | "development_partner";

export interface AdminPartner {
  id: string;
  slug: string;
  name: string;
  partner_type: PartnerType;
  summary: string | null;
  website_url: string | null;
  sort_order: number;
  publication_status: PublicationStatus;
  logo: (ImageValue & { width: number | null; height: number | null }) | null;
  areas: { slug: string; name: string }[];
  programs: { slug: string; title: string }[];
  created_at: string;
  updated_at: string;
}

export const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  community_organization: "Community organization",
  technical_institution: "Technical or training institution",
  business: "Business",
  researcher: "Researcher or research institution",
  financial_institution: "Financial institution",
  public_institution: "Government or public institution",
  development_partner: "Development partner or funder",
};
