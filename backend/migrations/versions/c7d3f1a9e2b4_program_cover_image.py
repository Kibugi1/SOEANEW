"""program cover image

Programs gain an optional cover photo (an uploaded image) for program cards and the
top of the program page.

Revision ID: c7d3f1a9e2b4
Revises: 9c6c9df8034c
Create Date: 2026-11-23 22:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c7d3f1a9e2b4'
down_revision = '9c6c9df8034c'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('program', schema=None) as batch_op:
        batch_op.add_column(sa.Column('cover_image_id', sa.Uuid(), nullable=True))
        batch_op.create_foreign_key(
            op.f('fk_program_cover_image_id_media_asset'),
            'media_asset', ['cover_image_id'], ['id'], ondelete='SET NULL',
        )


def downgrade():
    with op.batch_alter_table('program', schema=None) as batch_op:
        batch_op.drop_constraint(op.f('fk_program_cover_image_id_media_asset'), type_='foreignkey')
        batch_op.drop_column('cover_image_id')
