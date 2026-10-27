"""Frontend route prefixes used to build the `url` fields in responses.

One place to change if a route is renamed (the canonical story route is still an open
decision: /people-stories/{slug} vs /news/{slug}).
"""
TEAM_URL_PREFIX = "/team"
STORY_URL_PREFIX = "/people-stories"
PROGRAM_URL_PREFIX = "/programs"
THEME_URL_PREFIX = "/our-focus"
LOCATION_URL_PREFIX = "/where-we-work"
