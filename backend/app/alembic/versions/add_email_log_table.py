"""Add email_log table for tracking email sends

Revision ID: add_email_log_table
Revises: c6a614e86744
Create Date: 2025-11-13 16:37:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision = 'add_email_log_table'
down_revision = 'c6a614e86744'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create emaillog table
    op.create_table(
        'emaillog',
        sa.Column('email_to', sa.String(length=255), nullable=False),
        sa.Column('email_type', sa.String(length=50), nullable=False),
        sa.Column('subject', sa.String(length=255), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('error_message', sa.String(length=1000), nullable=True),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('sent_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    # Drop emaillog table
    op.drop_table('emaillog')
