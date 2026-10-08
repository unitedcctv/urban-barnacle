"""Add filament table for 3D printer filament inventory

Idempotent: safe on databases rebuilt from scratch as well as existing ones.

Revision ID: add_filament_table
Revises: add_item_display_order
"""
from alembic import op
import sqlalchemy as sa


revision = 'add_filament_table'
down_revision = 'add_item_display_order'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'filament' not in inspector.get_table_names():
        op.create_table(
            'filament',
            sa.Column('colour', sa.String(length=100), nullable=False),
            sa.Column('colour_hex', sa.String(length=7), nullable=True),
            sa.Column('material', sa.String(length=20), nullable=False),
            sa.Column('spools', sa.Float(), nullable=False),
            sa.Column('manufacturer', sa.String(length=255), nullable=False),
            sa.Column('price', sa.Float(), nullable=True),
            sa.Column('purchase_url', sa.String(length=500), nullable=True),
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint('id'),
        )


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'filament' in inspector.get_table_names():
        op.drop_table('filament')
