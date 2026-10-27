"""The ONLY way public endpoints should select stories and profiles.

Every rule about what is public lives here, so a draft, scheduled, confidential or
unconsented story cannot leak because one route forgot a filter.
"""
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import or_, select

from .location import Location
from .program import Milestone, Phase, Program, TrainingTrack, program_locations, program_themes, track_themes
from .story import (
    PUBLIC_CONSENT_STATUSES,
    Story,
    StoryTeamMember,
    story_authors,
    story_locations,
    story_phases,
    story_programs,
    story_themes,
)
from .team_profile import TeamProfile, profile_programs
from .thematic_area import ThematicArea


def public_stories():
    return (
        select(Story)
        .where(
            Story.status == "PUBLISHED",
            Story.published_at.is_not(None),
            Story.published_at <= datetime.now(timezone.utc),  # excludes scheduled
            Story.is_confidential.is_(False),
            Story.consent_status.in_(PUBLIC_CONSENT_STATUSES),
        )
        .order_by(Story.published_at.desc(), Story.id)  # id breaks ties: deterministic
    )


def public_story_by_slug(slug: str):
    return public_stories().where(Story.slug == slug)


def public_stories_for_profile(profile_id: UUID):
    """Public stories a person is named on: as an author, or as lead / support."""
    authored = select(story_authors.c.story_id).where(story_authors.c.profile_id == profile_id)
    on_team = select(StoryTeamMember.story_id).where(StoryTeamMember.profile_id == profile_id)
    return public_stories().where(or_(Story.id.in_(authored), Story.id.in_(on_team)))


def _public_stories_tagged(link_table, link_column: str, model, entity_id: UUID):
    """Public stories tagged with a published program / place / theme."""
    return (
        public_stories()
        .join(link_table, link_table.c.story_id == Story.id)
        .join(model, model.id == link_table.c[link_column])
        .where(model.id == entity_id, model.publication_status == "published")
    )


def public_stories_for_program(program_id: UUID):
    return _public_stories_tagged(story_programs, "program_id", Program, program_id)


def public_stories_for_location(location_id: UUID):
    return _public_stories_tagged(story_locations, "location_id", Location, location_id)


def public_stories_for_theme(theme_id: UUID):
    return _public_stories_tagged(story_themes, "theme_id", ThematicArea, theme_id)


def public_stories_for_phase(phase_id: UUID):
    """A phase's stories need both the phase and its program to be published."""
    return (
        public_stories()
        .join(story_phases, story_phases.c.story_id == Story.id)
        .join(Phase, Phase.id == story_phases.c.phase_id)
        .join(Program, Program.id == Phase.program_id)
        .where(
            Phase.id == phase_id,
            Phase.publication_status == "published",
            Program.publication_status == "published",
        )
    )


def public_profiles():
    return (
        select(TeamProfile)
        .where(TeamProfile.status == "published")
        .order_by(TeamProfile.sort_order, TeamProfile.display_name, TeamProfile.id)
    )


def public_profile_by_slug(slug: str):
    return public_profiles().where(TeamProfile.slug == slug)


# ---------------------------------------------------------------------------
# Content models. A child (phase, milestone, track) is public only when its own
# publication_status AND every parent's publication_status are "published".
# ---------------------------------------------------------------------------

def public_themes():
    return (
        select(ThematicArea)
        .where(ThematicArea.publication_status == "published")
        .order_by(ThematicArea.is_anchor.desc(), ThematicArea.sort_order, ThematicArea.name, ThematicArea.id)
    )


def public_theme_by_slug(slug: str):
    return public_themes().where(ThematicArea.slug == slug)


def public_locations():
    return (
        select(Location)
        .where(Location.publication_status == "published")
        .order_by(Location.sort_order, Location.name, Location.id)
    )


def public_location_by_slug(slug: str):
    return public_locations().where(Location.slug == slug)


def public_programs():
    return (
        select(Program)
        .where(Program.publication_status == "published")
        .order_by(Program.is_featured.desc(), Program.sort_order, Program.title, Program.id)
    )


def public_program_by_slug(slug: str):
    return public_programs().where(Program.slug == slug)


def public_phases(program_id: UUID):
    return (
        select(Phase)
        .join(Program, Phase.program_id == Program.id)
        .where(
            Program.id == program_id,
            Program.publication_status == "published",
            Phase.publication_status == "published",
        )
        .order_by(Phase.sequence, Phase.id)
    )


def public_milestones(program_id: UUID):
    return (
        select(Milestone)
        .join(Phase, Milestone.phase_id == Phase.id)
        .join(Program, Phase.program_id == Program.id)
        .where(
            Program.id == program_id,
            Program.publication_status == "published",
            Phase.publication_status == "published",
            Milestone.publication_status == "published",
        )
        .order_by(Phase.sequence, Milestone.sort_order, Milestone.id)
    )


def public_tracks(program_id: UUID):
    return (
        select(TrainingTrack)
        .join(Program, TrainingTrack.program_id == Program.id)
        .where(
            Program.id == program_id,
            Program.publication_status == "published",
            TrainingTrack.publication_status == "published",
        )
        .order_by(TrainingTrack.sort_order, TrainingTrack.title, TrainingTrack.id)
    )


# ---------------------------------------------------------------------------
# Cross-links between public entities.
# ---------------------------------------------------------------------------

def public_child_locations(parent_id: UUID):
    return public_locations().where(Location.parent_id == parent_id)


def public_programs_for_theme(theme_id: UUID):
    linked = select(program_themes.c.program_id).where(program_themes.c.theme_id == theme_id)
    return public_programs().where(Program.id.in_(linked))


def public_programs_for_location(location_id: UUID):
    linked = select(program_locations.c.program_id).where(program_locations.c.location_id == location_id)
    return public_programs().where(Program.id.in_(linked))


def public_tracks_for_theme(theme_id: UUID):
    """Tracks linked to a theme; the track and its program must both be published."""
    return (
        select(TrainingTrack)
        .join(Program, TrainingTrack.program_id == Program.id)
        .join(track_themes, track_themes.c.track_id == TrainingTrack.id)
        .where(
            track_themes.c.theme_id == theme_id,
            Program.publication_status == "published",
            TrainingTrack.publication_status == "published",
        )
        .order_by(Program.sort_order, TrainingTrack.sort_order, TrainingTrack.title, TrainingTrack.id)
    )


def public_profiles_for_program(program_id: UUID):
    linked = select(profile_programs.c.profile_id).where(profile_programs.c.program_id == program_id)
    return public_profiles().where(TeamProfile.id.in_(linked))
