"""Add column user priviliges to User model

Revision ID: 06e147cc51b7
Revises: 1a31ce608336
Create Date: 2024-12-29 18:39:12.087032

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = "06e147cc51b7"
down_revision = "1a31ce608336"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column(
        "user",
        sa.Column(
            "has_privileges",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column("user", "has_priviliges")
    # ### end Alembic commands ###
