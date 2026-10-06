"""Add display_order column to image table for persistent image ordering

Idempotent: safe on databases rebuilt from scratch as well as existing ones.

Revision ID: add_image_display_order
Revises: add_contact_enquiry_table
"""
from alembic import op
import sqlalchemy as sa

revision = 'add_image_display_order'
down_revision = 'add_contact_enquiry_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'image' not in inspector.get_table_names():
        return
    image_columns = [c['name'] for c in inspector.get_columns('image')]
    if 'display_order' not in image_columns:
        op.add_column('image', sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'))
        # Backfill per-item ordering based on creation time so existing
        # galleries keep their current visual order.
        op.execute("""
            UPDATE image SET display_order = sub.rn - 1
            FROM (
                SELECT id, ROW_NUMBER() OVER (PARTITION BY item_id ORDER BY created_at) AS rn
                FROM image
            ) sub
            WHERE image.id = sub.id
        """)


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'image' not in inspector.get_table_names():
        return
    image_columns = [c['name'] for c in inspector.get_columns('image')]
    if 'display_order' in image_columns:
        op.drop_column('image', 'display_order')
