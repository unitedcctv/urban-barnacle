"""Add display_order column to item table for persistent item ordering

Idempotent: safe on databases rebuilt from scratch as well as existing ones.

Revision ID: add_item_display_order
Revises: add_image_display_order
"""
from alembic import op
import sqlalchemy as sa

revision = 'add_item_display_order'
down_revision = 'add_image_display_order'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'item' not in inspector.get_table_names():
        return
    item_columns = [c['name'] for c in inspector.get_columns('item')]
    if 'display_order' not in item_columns:
        op.add_column('item', sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'))
        # Backfill with a stable initial order so the current sequence stays
        # deterministic until an admin reorders items explicitly.
        op.execute("""
            UPDATE item SET display_order = sub.rn - 1
            FROM (
                SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
                FROM item
            ) sub
            WHERE item.id = sub.id
        """)


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'item' not in inspector.get_table_names():
        return
    item_columns = [c['name'] for c in inspector.get_columns('item')]
    if 'display_order' in item_columns:
        op.drop_column('item', 'display_order')
