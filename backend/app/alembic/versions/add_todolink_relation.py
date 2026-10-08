"""Add relation column to todolink for typed todo relations

Idempotent: safe on databases rebuilt from scratch as well as existing ones.
Existing links keep working as "linked" relations.

Revision ID: add_todolink_relation
Revises: add_filament_table
"""
from alembic import op
import sqlalchemy as sa

revision = 'add_todolink_relation'
down_revision = 'add_filament_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'todolink' not in inspector.get_table_names():
        return
    todolink_columns = [c['name'] for c in inspector.get_columns('todolink')]
    if 'relation' not in todolink_columns:
        op.add_column('todolink', sa.Column('relation', sa.String(length=20), nullable=False, server_default='linked'))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'todolink' not in inspector.get_table_names():
        return
    todolink_columns = [c['name'] for c in inspector.get_columns('todolink')]
    if 'relation' in todolink_columns:
        op.drop_column('todolink', 'relation')
