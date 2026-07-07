"""Remap removed user permissions (customer/investor/producer) to guest

Revision ID: remap_removed_permissions
Revises: add_email_log_table
Create Date: 2026-07-07 13:42:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'remap_removed_permissions'
down_revision = 'add_email_log_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Remap any users holding a removed permission type to 'guest'.
    # The UserPermission enum now only supports: superuser, guest, collector.
    op.execute(
        sa.text(
            "UPDATE \"user\" SET permissions = 'guest' "
            "WHERE permissions IN ('customer', 'investor', 'producer')"
        )
    )


def downgrade() -> None:
    # Data migration is not reversible: original permission values are lost.
    pass
