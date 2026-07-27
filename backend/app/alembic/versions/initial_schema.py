"""Initial base schema (user, item, image, producer, review)

Historically these tables were created via SQLModel.metadata.create_all,
which left fresh databases without the base schema when running migrations.
This migration creates the base tables as they existed before the
'add_social_posts' revision. Tables are only created if they don't already
exist, so databases bootstrapped via create_all are unaffected.

Revision ID: initial_schema
Revises:
Create Date: 2026-07-15

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    if 'user' not in existing_tables:
        op.create_table(
            'user',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('email', sa.String(length=255), nullable=False),
            sa.Column('is_active', sa.Boolean(), nullable=False),
            sa.Column('permissions', sa.String(length=255), nullable=False),
            sa.Column('full_name', sa.String(length=255), nullable=True),
            sa.Column('hashed_password', sa.String(), nullable=False),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index(op.f('ix_user_email'), 'user', ['email'], unique=True)

    if 'producer' not in existing_tables:
        op.create_table(
            'producer',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('location', sa.String(length=255), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint('id'),
        )

    if 'item' not in existing_tables:
        op.create_table(
            'item',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('description', sa.String(length=255), nullable=True),
            sa.Column('images', sa.String(), nullable=True),
            sa.Column('model', sa.String(), nullable=True),
            sa.Column('certificate', sa.String(), nullable=True),
            sa.Column('is_original', sa.Boolean(), nullable=False),
            sa.Column('variant_of', sa.Uuid(), nullable=True),
            sa.Column('owner_id', sa.Uuid(), nullable=False),
            sa.Column('producer_id', sa.Uuid(), nullable=True),
            sa.ForeignKeyConstraint(['owner_id'], ['user.id']),
            sa.ForeignKeyConstraint(['producer_id'], ['producer.id']),
            sa.ForeignKeyConstraint(['variant_of'], ['item.id']),
            sa.PrimaryKeyConstraint('id'),
        )

    if 'image' not in existing_tables:
        op.create_table(
            'image',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('path', sa.String(length=500), nullable=False),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('item_id', sa.Uuid(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(['item_id'], ['item.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
        )

    if 'review' not in existing_tables:
        op.create_table(
            'review',
            sa.Column('id', sa.Uuid(), nullable=False),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('review_text', sa.String(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('producer_id', sa.Uuid(), nullable=False),
            sa.ForeignKeyConstraint(['producer_id'], ['producer.id']),
            sa.PrimaryKeyConstraint('id'),
        )


def downgrade() -> None:
    op.drop_table('review')
    op.drop_table('image')
    op.drop_table('item')
    op.drop_table('producer')
    op.drop_index(op.f('ix_user_email'), table_name='user')
    op.drop_table('user')
