"""Allowed values shared by the content models.

Two different "status" ideas are kept apart on purpose:

* publication_status: internal gate (draft / published / archived). Only "published"
  rows can ever appear in a public response. Never serialized.
* status (progress): the public badge from the content guide
  (completed / in_progress / planned / coming_soon). Safe to show.
"""

PUBLICATION_STATUSES = ("draft", "published", "archived")
# "in_development" is shown as "Concept in development" (e.g. JEET Champions, Nov 2026).
PROGRESS_STATUSES = ("completed", "in_progress", "planned", "coming_soon", "in_development")
LOCATION_TYPES = ("country", "county", "community")
ENGAGEMENT_STATUSES = ("active", "focus_only")
TRACK_TYPES = ("core", "specialized")

# A person's role on a story, besides being a named author (the byline).
TEAM_ROLES = ("lead", "support")

# Kinds of partner organization, from the content guide ("community organizations, technical
# institutions, businesses, researchers, financial institutions, public institutions and
# development partners"). The guide gives no codes, so these names are a proposal.
PARTNER_TYPES = (
    "community_organization",
    "technical_institution",
    "business",
    "researcher",
    "financial_institution",
    "public_institution",
    "development_partner",
)
