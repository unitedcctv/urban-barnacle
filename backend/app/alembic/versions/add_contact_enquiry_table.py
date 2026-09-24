"""Add contactenquiry table for website contact form submissions

Revision ID: add_contact_enquiry_table
Revises: add_todo_tables
Create Date: 2026-09-24 00:00:00.000000

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = 'add_contact_enquiry_table'
down_revision = 'add_todo_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'contactenquiry',
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('subject', sa.String(length=255), nullable=True),
        sa.Column('message', sa.String(length=5000), nullable=False),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('contactenquiry')
