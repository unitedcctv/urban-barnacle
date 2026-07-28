import sqlalchemy as sa
from alembic import op

revision = "add_nft_fields_to_item"
down_revision = "remap_removed_permissions"
branch_labels = None
depends_on = None


NFT_COLUMNS = {
    "nft_token_id": sa.Column("nft_token_id", sa.Integer(), nullable=True),
    "nft_contract_address": sa.Column(
        "nft_contract_address", sa.String(length=255), nullable=True
    ),
    "nft_transaction_hash": sa.Column(
        "nft_transaction_hash", sa.String(length=255), nullable=True
    ),
    "nft_metadata_uri": sa.Column(
        "nft_metadata_uri", sa.String(length=500), nullable=True
    ),
    "is_nft_enabled": sa.Column(
        "is_nft_enabled", sa.Boolean(), nullable=False, server_default=sa.false()
    ),
}


def upgrade() -> None:
    bind = op.get_bind()
    existing_columns = {
        column["name"] for column in sa.inspect(bind).get_columns("item")
    }
    for name, column in NFT_COLUMNS.items():
        if name not in existing_columns:
            op.add_column("item", column)


def downgrade() -> None:
    bind = op.get_bind()
    existing_columns = {
        column["name"] for column in sa.inspect(bind).get_columns("item")
    }
    for name in reversed(NFT_COLUMNS):
        if name in existing_columns:
            op.drop_column("item", name)
