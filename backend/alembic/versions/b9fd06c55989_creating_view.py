"""creating view

Revision ID: b9fd06c55989
Revises: 156bee3cb712
Create Date: 2025-09-12 14:48:52.786343

"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy_views import CreateView, DropView

from alembic import op
from app.office_mgnt.views import office_member_details, office_member_details_def

# revision identifiers, used by Alembic.
revision: str = "b9fd06c55989"
down_revision: Union[str, Sequence[str], None] = "156bee3cb712"
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
