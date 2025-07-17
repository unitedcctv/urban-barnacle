"""add_chunks_table_for_embeddings

Revision ID: 09465fcadea9
Revises: 4be7250b4d82
Create Date: 2025-07-17 15:49:21.198864

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '09465fcadea9'
down_revision = '4be7250b4d82'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('chunks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('chunk', sa.Text(), nullable=False),
        sa.Column('vec', sa.dialects.postgresql.ARRAY(sa.Float()), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    op.drop_table('chunks')
