"""create view

Revision ID: 25f755eb3df5
Revises: 6ff147f13dcc
Create Date: 2025-09-18 13:36:51.221161

"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy_views import CreateView, DropView

from alembic import op
from app.office_mgnt.views import office_member_details, office_member_details_def

# revision identifiers, used by Alembic.
revision: str = "25f755eb3df5"
down_revision: Union[str, Sequence[str], None] = "6ff147f13dcc"
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
