"""Add is_original and variant_of to item

Revision ID: 1b2c3d4e5f67
Revises: 5a8aa0b4a654
Create Date: 2025-08-20 16:30:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import sqlmodel.sql.sqltypes

# revision identifiers, used by Alembic.
revision = "1b2c3d4e5f67"
down_revision = "5a8aa0b4a654"
branch_labels = None
depends_on = None


def upgrade():
    # Add columns
    op.add_column(
        "item",
        sa.Column("is_original", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.add_column(
        "item",
        sa.Column("variant_of", postgresql.UUID(as_uuid=True), nullable=True),
    )
    # Add FK to self (item.id)
    op.create_foreign_key(
        "item_variant_of_fkey",
        source_table="item",
        referent_table="item",
        local_cols=["variant_of"],
        remote_cols=["id"],
        ondelete="SET NULL",
    )
    # Add check constraint to enforce logic: if not original, variant_of must be set
    op.create_check_constraint(
        "ck_item_variant_requires_parent",
        "item",
        "(is_original = true AND variant_of IS NULL) OR (is_original = false AND variant_of IS NOT NULL)",
    )

    # Drop server default to avoid future implicit defaults
    op.alter_column("item", "is_original", server_default=None)


def downgrade():
    # Drop constraint and FK, then columns
    op.drop_constraint("ck_item_variant_requires_parent", "item", type_="check")
    op.drop_constraint("item_variant_of_fkey", "item", type_="foreignkey")
    op.drop_column("item", "variant_of")
    op.drop_column("item", "is_original")
