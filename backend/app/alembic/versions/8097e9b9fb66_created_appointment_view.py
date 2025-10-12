"""created appointment view

Revision ID: 8097e9b9fb66
Revises: 2e4d4aaa8eda
Create Date: 2025-09-25 10:50:49.539219

"""

from typing import Sequence, Union

from alembic import op
from sqlalchemy_views import DropView

# revision identifiers, used by Alembic.
revision: str = "8097e9b9fb66"
down_revision: Union[str, Sequence[str], None] = "2e4d4aaa8eda"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create the appointment_details view WITHOUT the 'issued_by' column.
    # 'issued_by' is introduced in a later migration to avoid referencing a non-existent column here.
    op.execute(
        """
        CREATE OR REPLACE VIEW appointment_details AS
        SELECT
            users.id AS host_id,
            users.first_name,
            users.last_name,
            users.email,
            appointments.id AS appointment_id,
            appointments.purpose,
            appointments.appointment_date,
            appointments.time_slotted,
            appointments.status,
            appointments.is_active AS appointment_active,
            appointments.created_at,
            appointments.updated_at,
            appointments.canceled_at,
            appointments.canceled_reason AS reason,
            appointments.office_id,
            citizen_info.id AS citizen_id,
            citizen_info.firstname AS citizen_firstname,
            citizen_info.lastname AS citizen_lastname,
            citizen_info.email AS citizen_email,
            citizen_info.phone AS citizen_phone
        FROM appointments
        JOIN users ON users.id = appointments.host_id
        JOIN citizen_info ON citizen_info.id = appointments.citizen_id
        """
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop by name since this migration defined the view inline
    from sqlalchemy import Table, MetaData
    metadata = MetaData()
    appointment_details = Table("appointment_details", metadata)
    op.execute(DropView(appointment_details))
