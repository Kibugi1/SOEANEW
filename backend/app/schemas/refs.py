"""Compact references to other public entities, with unpublished ones filtered out."""
from .urls import LOCATION_URL_PREFIX, PROGRAM_URL_PREFIX, THEME_URL_PREFIX


def published(items):
    """Keep only rows whose publication_status is 'published'."""
    return [item for item in items if item.publication_status == "published"]


def program_ref(program) -> dict:
    return {
        "slug": program.slug,
        "title": program.title,
        "short_name": program.short_name,
        "url": f"{PROGRAM_URL_PREFIX}/{program.slug}",
    }


def theme_ref(theme) -> dict:
    return {"slug": theme.slug, "name": theme.name, "url": f"{THEME_URL_PREFIX}/{theme.slug}"}


def location_ref(location) -> dict:
    return {"slug": location.slug, "name": location.name, "url": f"{LOCATION_URL_PREFIX}/{location.slug}"}
