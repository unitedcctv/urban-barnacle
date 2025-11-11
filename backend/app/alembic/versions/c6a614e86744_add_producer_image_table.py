"""Add producer_image table

Revision ID: c6a614e86744
Revises: 192d43422f21
Create Date: 2025-11-11 20:23:52.059836

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision = 'c6a614e86744'
down_revision = '192d43422f21'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create producer_image table
    op.create_table(
        'producerimage',
        sa.Column('path', sa.String(length=500), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('image_type', sa.String(length=50), nullable=False),
        sa.Column('producer_id', sa.Uuid(), nullable=False),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['producer_id'], ['producer.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    # Drop producer_image table
    op.drop_table('producerimage')
