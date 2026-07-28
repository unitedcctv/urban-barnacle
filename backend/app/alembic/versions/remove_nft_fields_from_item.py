import sqlalchemy as sa
from alembic import op


revision = "remove_nft_fields_from_item"
down_revision = "add_nft_fields_to_item"
branch_labels = None
depends_on = None


NFT_COLUMNS = (
    "nft_token_id",
    "nft_contract_address",
    "nft_transaction_hash",
    "nft_metadata_uri",
    "is_nft_enabled",
)


def upgrade() -> None:
    bind = op.get_bind()
    existing_columns = {
        column["name"] for column in sa.inspect(bind).get_columns("item")
    }
    for name in NFT_COLUMNS:
        if name in existing_columns:
            op.drop_column("item", name)


def downgrade() -> None:
    op.add_column("item", sa.Column("nft_token_id", sa.Integer(), nullable=True))
    op.add_column(
        "item", sa.Column("nft_contract_address", sa.String(length=255), nullable=True)
    )
    op.add_column(
        "item", sa.Column("nft_transaction_hash", sa.String(length=255), nullable=True)
    )
    op.add_column(
        "item", sa.Column("nft_metadata_uri", sa.String(length=500), nullable=True)
    )
    op.add_column(
        "item",
        sa.Column("is_nft_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
