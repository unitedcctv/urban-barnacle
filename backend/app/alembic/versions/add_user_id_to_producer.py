"""Add user_id to producer table

Revision ID: add_user_id_to_producer
Revises: add_social_posts
Create Date: 2025-10-22

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision = 'add_user_id_to_producer'
down_revision = 'add_social_posts'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add user_id column to producer table (nullable initially)
    op.add_column('producer', sa.Column('user_id', sa.Uuid(), nullable=True))
    
    # Add foreign key constraint
    op.create_foreign_key(
        'fk_producer_user_id',
        'producer',
        'user',
        ['user_id'],
        ['id']
    )
    
    # After adding the column and constraint, make it non-nullable
    # (Only if you want existing rows to fail - skip this for now since we may have existing producers)
    # op.alter_column('producer', 'user_id', nullable=False)


def downgrade() -> None:
    # Drop foreign key constraint
    op.drop_constraint('fk_producer_user_id', 'producer', type_='foreignkey')
    
    # Drop user_id column
    op.drop_column('producer', 'user_id')
