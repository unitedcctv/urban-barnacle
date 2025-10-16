"""Add social posts table

Revision ID: add_social_posts
Revises: 
Create Date: 2025-10-15

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision = 'add_social_posts'
down_revision = None  # Update this to the latest revision ID
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create social_post table
    op.create_table(
        'socialpost',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('platform', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('post_id', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('author', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('author_avatar', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('content', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('url', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('fetched_at', sa.DateTime(), nullable=False),
        sa.Column('likes', sa.Integer(), nullable=False),
        sa.Column('reposts', sa.Integer(), nullable=False),
        sa.Column('replies', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(op.f('ix_socialpost_platform'), 'socialpost', ['platform'], unique=False)
    op.create_index(op.f('ix_socialpost_post_id'), 'socialpost', ['post_id'], unique=True)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_socialpost_post_id'), table_name='socialpost')
    op.drop_index(op.f('ix_socialpost_platform'), table_name='socialpost')
    
    # Drop table
    op.drop_table('socialpost')
