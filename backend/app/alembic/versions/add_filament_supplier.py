"""Store EU supplier variants independently of local filament stock."""

import sqlalchemy as sa
from alembic import op

revision = "add_filament_supplier"
down_revision = "add_todolink_relation"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("filament", sa.Column("product_name", sa.String(100), nullable=True))
    op.add_column("filament", sa.Column("variant_name", sa.String(100), nullable=True))
    op.add_column("filament", sa.Column("supplier_sku", sa.String(100), nullable=True))
    op.add_column(
        "filament", sa.Column("supplier_availability", sa.String(50), nullable=True)
    )
    op.add_column(
        "filament",
        sa.Column("supplier_checked_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column("filament", sa.Column("supplier_data", sa.JSON(), nullable=True))
    op.create_unique_constraint("uq_filament_supplier_sku", "filament", ["supplier_sku"])


def downgrade() -> None:
    op.drop_constraint("uq_filament_supplier_sku", "filament", type_="unique")
    for name in (
        "supplier_data",
        "supplier_checked_at",
        "supplier_availability",
        "supplier_sku",
        "variant_name",
        "product_name",
    ):
        op.drop_column("filament", name)
