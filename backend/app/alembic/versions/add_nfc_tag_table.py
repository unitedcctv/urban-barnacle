"""Add nfc_tag table for NTAG 424 DNA tag validation

Revision ID: add_nfc_tag_table
Revises: remove_nft_fields_from_item
Create Date: 2026-08-26 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision = 'add_nfc_tag_table'
down_revision = 'remove_nft_fields_from_item'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create nfctag table (stores UIDs and tap counters only - no key material)
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'nfctag' in inspector.get_table_names():
        return
    op.create_table(
        'nfctag',
        sa.Column('uid', sa.String(length=14), nullable=False),
        sa.Column('item_id', sa.Uuid(), nullable=False),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('last_read_counter', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['item_id'], ['item.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_nfctag_uid'), 'nfctag', ['uid'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_nfctag_uid'), table_name='nfctag')
    op.drop_table('nfctag')
