"""Add todo and todolink tables for the superuser todo list

Revision ID: add_todo_tables
Revises: add_price_and_sold_to_item
Create Date: 2026-09-23 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision = 'add_todo_tables'
down_revision = 'add_price_and_sold_to_item'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if 'todo' in inspector.get_table_names():
        return
    op.create_table(
        'todo',
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.String(length=2000), nullable=True),
        sa.Column('deadline', sa.DateTime(), nullable=True),
        sa.Column('position', sa.Integer(), nullable=False),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_todo_position'), 'todo', ['position'], unique=False)
    op.create_table(
        'todolink',
        sa.Column('from_id', sa.Uuid(), nullable=False),
        sa.Column('to_id', sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(['from_id'], ['todo.id']),
        sa.ForeignKeyConstraint(['to_id'], ['todo.id']),
        sa.PrimaryKeyConstraint('from_id', 'to_id')
    )


def downgrade() -> None:
    op.drop_table('todolink')
    op.drop_index(op.f('ix_todo_position'), table_name='todo')
    op.drop_table('todo')
