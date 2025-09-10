"""creating view

Revision ID: 252e4ca8f9d4
Revises: 181ff0f23ac2
Create Date: 2025-09-10 13:37:08.323505

"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy_views import CreateView, DropView

from alembic import op
from app.office_mgnt.views import office_member_details, office_member_details_def

revision: str = "252e4ca8f9d4"
down_revision: Union[str, Sequence[str], None] = "181ff0f23ac2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        CreateView(office_member_details, office_member_details_def, or_replace=True)
    )


def downgrade() -> None:
    op.execute(DropView(office_member_details))
