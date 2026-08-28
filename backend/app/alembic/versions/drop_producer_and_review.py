"""Drop producer, producerimage and review tables; remove item.producer_id

Producers (and producer-bound reviews) were removed from the domain model.
This migration is idempotent so it is safe on databases rebuilt from
scratch as well as existing ones.

Revision ID: drop_producer_and_review
Revises: add_nfc_tag_table
"""
from alembic import op
import sqlalchemy as sa

revision = 'drop_producer_and_review'
down_revision = 'add_nfc_tag_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()

    if 'item' in existing_tables:
        item_columns = [c['name'] for c in inspector.get_columns('item')]
        if 'producer_id' in item_columns:
            op.drop_column('item', 'producer_id')

    for table in ('review', 'producerimage', 'producer'):
        if table in existing_tables:
            op.drop_table(table)


def downgrade() -> None:
    # Destructive migration: producer/review data cannot be restored.
    pass
