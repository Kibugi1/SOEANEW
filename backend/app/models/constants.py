"""Allowed values shared by the content models.

Two different "status" ideas are kept apart on purpose:

* publication_status: internal gate (draft / published / archived). Only "published"
  rows can ever appear in a public response. Never serialized.
* status (progress): the public badge from the content guide
  (completed / in_progress / planned / coming_soon). Safe to show.
"""

PUBLICATION_STATUSES = ("draft", "published", "archived")
PROGRESS_STATUSES = ("completed", "in_progress", "planned", "coming_soon")
LOCATION_TYPES = ("country", "county", "community")
ENGAGEMENT_STATUSES = ("active", "focus_only")
TRACK_TYPES = ("core", "specialized")

# A person's role on a story, besides being a named author (the byline).
TEAM_ROLES = ("lead", "support")
