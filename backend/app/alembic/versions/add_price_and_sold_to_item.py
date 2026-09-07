"""Add price and is_sold columns to item table for shopping cart

Idempotent: safe on databases rebuilt from scratch as well as existing ones.

Revision ID: add_price_and_sold_to_item
Revises: drop_producer_and_review
"""
from alembic import op
import sqlalchemy as sa

revision = 'add_price_and_sold_to_item'
down_revision = 'drop_producer_and_review'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'item' not in inspector.get_table_names():
        return
    item_columns = [c['name'] for c in inspector.get_columns('item')]
    if 'price' not in item_columns:
        op.add_column('item', sa.Column('price', sa.Float(), nullable=False, server_default='0'))
    if 'is_sold' not in item_columns:
        op.add_column('item', sa.Column('is_sold', sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'item' not in inspector.get_table_names():
        return
    item_columns = [c['name'] for c in inspector.get_columns('item')]
    if 'is_sold' in item_columns:
        op.drop_column('item', 'is_sold')
    if 'price' in item_columns:
        op.drop_column('item', 'price')
