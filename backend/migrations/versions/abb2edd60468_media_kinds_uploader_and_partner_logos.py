"""media kinds, uploader and partner logos

Uploaded files record whether they are an image or a document and who uploaded them;
partners gain a logo. Existing media rows are images.

Revision ID: abb2edd60468
Revises: a1c4e7d2b9f0
Create Date: 2026-11-23 12:00:48.234381

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'abb2edd60468'
down_revision = 'a1c4e7d2b9f0'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('media_asset', schema=None) as batch_op:
        batch_op.add_column(sa.Column('kind', sa.String(length=20), server_default='image', nullable=False))
        batch_op.add_column(sa.Column('uploaded_by_user_id', sa.Uuid(), nullable=True))
        batch_op.create_check_constraint(op.f('ck_media_asset_kind'), "kind IN ('image', 'document')")
        batch_op.create_foreign_key(
            op.f('fk_media_asset_uploaded_by_user_id_user_account'),
            'user_account', ['uploaded_by_user_id'], ['id'], ondelete='SET NULL',
        )

    with op.batch_alter_table('partner', schema=None) as batch_op:
        batch_op.add_column(sa.Column('logo_id', sa.Uuid(), nullable=True))
        batch_op.create_foreign_key(
            op.f('fk_partner_logo_id_media_asset'),
            'media_asset', ['logo_id'], ['id'], ondelete='SET NULL',
        )


def downgrade():
    with op.batch_alter_table('partner', schema=None) as batch_op:
        batch_op.drop_constraint(op.f('fk_partner_logo_id_media_asset'), type_='foreignkey')
        batch_op.drop_column('logo_id')

    with op.batch_alter_table('media_asset', schema=None) as batch_op:
        batch_op.drop_constraint(op.f('fk_media_asset_uploaded_by_user_id_user_account'), type_='foreignkey')
        batch_op.drop_constraint(op.f('ck_media_asset_kind'), type_='check')
        batch_op.drop_column('uploaded_by_user_id')
        batch_op.drop_column('kind')
