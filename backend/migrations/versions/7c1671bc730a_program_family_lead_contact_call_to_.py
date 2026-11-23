"""program family, lead, contact, call to action, in-development status

Programs can sit under another program (JEET Champions under CECI), name a lead
profile and a public contact email, and carry a call to action that can be marked
pending until its link is approved. The progress status gains "in_development"
("Concept in development") on programs, phases, milestones and training tracks.

Revision ID: 7c1671bc730a
Revises: abb2edd60468
Create Date: 2026-11-23 12:33:18.211564

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7c1671bc730a'
down_revision = 'abb2edd60468'
branch_labels = None
depends_on = None


_PROGRESS_TABLES = ('program', 'phase', 'milestone', 'training_track')
_NEW = "status IN ('completed', 'in_progress', 'planned', 'coming_soon', 'in_development')"
_OLD = "status IN ('completed', 'in_progress', 'planned', 'coming_soon')"


def _replace_status_check(table, condition):
    with op.batch_alter_table(table, schema=None) as batch_op:
        batch_op.drop_constraint(op.f(f'ck_{table}_status'), type_='check')
        batch_op.create_check_constraint(op.f(f'ck_{table}_status'), condition)


def upgrade():
    for table in _PROGRESS_TABLES:
        _replace_status_check(table, _NEW)

    with op.batch_alter_table('program', schema=None) as batch_op:
        batch_op.add_column(sa.Column('parent_id', sa.Uuid(), nullable=True))
        batch_op.add_column(sa.Column('lead_profile_id', sa.Uuid(), nullable=True))
        batch_op.add_column(sa.Column('contact_email', sa.String(length=254), nullable=True))
        batch_op.add_column(sa.Column('cta_label', sa.String(length=120), nullable=True))
        batch_op.add_column(sa.Column('cta_url', sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column('cta_pending', sa.Boolean(), server_default=sa.text('false'), nullable=False))
        batch_op.create_index(op.f('ix_program_parent_id'), ['parent_id'], unique=False)
        batch_op.create_foreign_key(
            op.f('fk_program_lead_profile_id_team_profile'),
            'team_profile', ['lead_profile_id'], ['id'], ondelete='SET NULL',
        )
        batch_op.create_foreign_key(
            op.f('fk_program_parent_id_program'),
            'program', ['parent_id'], ['id'], ondelete='RESTRICT',
        )


def downgrade():
    with op.batch_alter_table('program', schema=None) as batch_op:
        batch_op.drop_constraint(op.f('fk_program_parent_id_program'), type_='foreignkey')
        batch_op.drop_constraint(op.f('fk_program_lead_profile_id_team_profile'), type_='foreignkey')
        batch_op.drop_index(op.f('ix_program_parent_id'))
        for column in ('cta_pending', 'cta_url', 'cta_label', 'contact_email', 'lead_profile_id', 'parent_id'):
            batch_op.drop_column(column)

    # The old constraint has no "in_development"; the nearest earlier status is "planned".
    for table in _PROGRESS_TABLES:
        op.execute(f"UPDATE {table} SET status = 'planned' WHERE status = 'in_development'")
        _replace_status_check(table, _OLD)
