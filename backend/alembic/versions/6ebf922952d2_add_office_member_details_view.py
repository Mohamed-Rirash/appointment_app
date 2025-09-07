"""add office_member_details view

Revision ID: 6ebf922952d2
Revises: 6bc8b0e42c1b
Create Date: 2025-09-07 14:23:44.807696

"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy_views import CreateView, DropView

from alembic import op
from app.office_mgnt.models import office_member_details, office_member_details_def

# revision identifiers, used by Alembic.
revision: str = "6ebf922952d2"
down_revision: Union[str, Sequence[str], None] = "6bc8b0e42c1b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute(
        CreateView(office_member_details, office_member_details_def, or_replace=True)
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute(DropView(office_member_details))
