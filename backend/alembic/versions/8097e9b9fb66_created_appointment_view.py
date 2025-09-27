"""created appointment view

Revision ID: 8097e9b9fb66
Revises: 2e4d4aaa8eda
Create Date: 2025-09-25 10:50:49.539219

"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy_views import CreateView, DropView

from alembic import op
from app.appointments.view import appointment_details, appointment_details_def

# revision identifiers, used by Alembic.
revision: str = "8097e9b9fb66"
down_revision: Union[str, Sequence[str], None] = "2e4d4aaa8eda"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.execute(
        CreateView(appointment_details, appointment_details_def, or_replace=True)
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute(DropView(appointment_details))
