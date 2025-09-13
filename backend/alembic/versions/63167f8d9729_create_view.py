"""create view

Revision ID: 63167f8d9729
Revises: 9c9764e8b1c0
Create Date: 2025-09-13 14:13:08.231883

"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy_views import CreateView, DropView

from alembic import op
from app.office_mgnt.views import office_member_details, office_member_details_def

# revision identifiers, used by Alembic.
revision: str = "63167f8d9729"
down_revision: Union[str, Sequence[str], None] = "9c9764e8b1c0"
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
