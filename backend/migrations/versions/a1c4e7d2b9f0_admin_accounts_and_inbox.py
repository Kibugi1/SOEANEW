"""admin accounts (author role, profile link) and the website inbox

Revision ID: a1c4e7d2b9f0
Revises: 852e1339fd79
Create Date: 2026-11-23 12:00:00

Accounts gain an `author` role, a display name, a forced password change after an
admin sets a temporary password, and a link to the public profile they write as.

Contact enquiries become the admin inbox: partnership enquiries, volunteer
applications and general messages, each routed to an inbox with a reference,
internal notes and an assignee. Existing rows are partnership enquiries.
"""
from alembic import op
import sqlalchemy as sa


revision = 'a1c4e7d2b9f0'
down_revision = '852e1339fd79'
branch_labels = None
depends_on = None


def upgrade():
    # --- user_account -------------------------------------------------------------
    with op.batch_alter_table('user_account', schema=None) as batch_op:
        batch_op.drop_constraint(op.f('ck_user_account_role'), type_='check')
        batch_op.create_check_constraint(op.f('ck_user_account_role'), "role IN ('admin', 'editor', 'author')")
        batch_op.add_column(sa.Column('full_name', sa.String(length=150), nullable=True))
        batch_op.add_column(sa.Column(
            'must_change_password', sa.Boolean(), nullable=False, server_default=sa.text('false'),
        ))
        batch_op.add_column(sa.Column('team_profile_id', sa.Uuid(), nullable=True))
        batch_op.create_unique_constraint(op.f('uq_user_account_team_profile_id'), ['team_profile_id'])
        batch_op.create_foreign_key(
            op.f('fk_user_account_team_profile_id_team_profile'),
            'team_profile', ['team_profile_id'], ['id'], ondelete='SET NULL',
        )

    # --- contact_enquiry ------------------------------------------------------------
    with op.batch_alter_table('contact_enquiry', schema=None) as batch_op:
        batch_op.add_column(sa.Column(
            'kind', sa.String(length=20), nullable=False, server_default='partnership',
        ))
        batch_op.add_column(sa.Column(
            'inbox', sa.String(length=20), nullable=False, server_default='partnerships',
        ))
        batch_op.add_column(sa.Column('reference', sa.String(length=24), nullable=True))
        batch_op.add_column(sa.Column('topic', sa.String(length=40), nullable=True))
        batch_op.add_column(sa.Column(
            'details', sa.JSON(), nullable=False, server_default=sa.text("'{}'"),
        ))
        batch_op.add_column(sa.Column('source_page', sa.String(length=200), nullable=True))
        batch_op.add_column(sa.Column('internal_notes', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('assigned_to_user_id', sa.Uuid(), nullable=True))
        batch_op.add_column(sa.Column('status_changed_at', sa.DateTime(timezone=True), nullable=True))

        batch_op.alter_column('organization', existing_type=sa.String(length=200), nullable=True)
        batch_op.alter_column('partnership_category', existing_type=sa.String(length=120), nullable=True)
        batch_op.alter_column('message', existing_type=sa.Text(), nullable=True)

        batch_op.create_unique_constraint(op.f('uq_contact_enquiry_reference'), ['reference'])
        batch_op.create_foreign_key(
            op.f('fk_contact_enquiry_assigned_to_user_id_user_account'),
            'user_account', ['assigned_to_user_id'], ['id'], ondelete='SET NULL',
        )
        batch_op.create_check_constraint(op.f('ck_contact_enquiry_kind'), "kind IN ('partnership', 'volunteer', 'contact')")
        batch_op.create_check_constraint(op.f('ck_contact_enquiry_inbox'), "inbox IN ('partnerships', 'volunteers', 'info')")
        batch_op.create_check_constraint(
            op.f('ck_contact_enquiry_status'), "status IN ('new', 'in_review', 'contacted', 'closed')",
        )
        batch_op.create_index(op.f('ix_contact_enquiry_inbox_status'), ['inbox', 'status'], unique=False)


def downgrade():
    # Volunteer and general messages have no place in the old, partnership-only shape.
    op.execute("DELETE FROM contact_enquiry WHERE kind <> 'partnership'")
    op.execute("UPDATE contact_enquiry SET organization = '' WHERE organization IS NULL")
    op.execute("UPDATE contact_enquiry SET partnership_category = '' WHERE partnership_category IS NULL")
    op.execute("UPDATE contact_enquiry SET message = '' WHERE message IS NULL")

    with op.batch_alter_table('contact_enquiry', schema=None) as batch_op:
        batch_op.drop_index(op.f('ix_contact_enquiry_inbox_status'))
        batch_op.drop_constraint(op.f('ck_contact_enquiry_status'), type_='check')
        batch_op.drop_constraint(op.f('ck_contact_enquiry_inbox'), type_='check')
        batch_op.drop_constraint(op.f('ck_contact_enquiry_kind'), type_='check')
        batch_op.drop_constraint(op.f('fk_contact_enquiry_assigned_to_user_id_user_account'), type_='foreignkey')
        batch_op.drop_constraint(op.f('uq_contact_enquiry_reference'), type_='unique')
        batch_op.alter_column('message', existing_type=sa.Text(), nullable=False)
        batch_op.alter_column('partnership_category', existing_type=sa.String(length=120), nullable=False)
        batch_op.alter_column('organization', existing_type=sa.String(length=200), nullable=False)
        for column in (
            'status_changed_at', 'assigned_to_user_id', 'internal_notes', 'source_page',
            'details', 'topic', 'reference', 'inbox', 'kind',
        ):
            batch_op.drop_column(column)

    op.execute("UPDATE user_account SET role = 'editor' WHERE role = 'author'")
    with op.batch_alter_table('user_account', schema=None) as batch_op:
        batch_op.drop_constraint(op.f('fk_user_account_team_profile_id_team_profile'), type_='foreignkey')
        batch_op.drop_constraint(op.f('uq_user_account_team_profile_id'), type_='unique')
        batch_op.drop_column('team_profile_id')
        batch_op.drop_column('must_change_password')
        batch_op.drop_column('full_name')
        batch_op.drop_constraint(op.f('ck_user_account_role'), type_='check')
        batch_op.create_check_constraint(op.f('ck_user_account_role'), "role IN ('admin', 'editor')")
