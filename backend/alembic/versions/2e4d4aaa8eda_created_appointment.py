"""created appointment

Revision ID: 2e4d4aaa8eda
Revises: 25f755eb3df5
Create Date: 2025-09-18 13:40:18.681857

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "2e4d4aaa8eda"
down_revision: Union[str, Sequence[str], None] = "25f755eb3df5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.create_table(
        "citizen_info",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("firstname", sa.String(length=100), nullable=False),
        sa.Column("lastname", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=100), nullable=False),
        sa.Column("phone", sa.String(length=20), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("phone"),
    )

    op.create_table(
        "appointments",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("citizen_id", sa.UUID(), nullable=False),
        sa.Column("host_id", sa.UUID(), nullable=False),
        sa.Column("office_id", sa.UUID(), nullable=False),
        sa.Column("purpose", sa.Text(), nullable=False),
        sa.Column("appointment_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("time_slotted", sa.Time(), nullable=False),
        sa.Column(
            "is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column("canceled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("canceled_by", sa.UUID(), nullable=True),
        sa.ForeignKeyConstraint(["canceled_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["citizen_id"], ["citizen_info.id"]),
        sa.ForeignKeyConstraint(["host_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["office_id"], ["offices.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    # 1. Create the enum type manually
    appointment_status_enum = sa.Enum(
        "PENDING",
        "CANCELLED",
        "COMPLETED",
        "NO_SHOW",
        "APPROVED",
        "DENIED",
        name="appointmentstatus",
    )
    appointment_status_enum.create(op.get_bind(), checkfirst=True)

    # 2. Add the column using that enum
    op.add_column(
        "appointments",
        sa.Column(
            "status",
            appointment_status_enum,
            nullable=False,
            server_default="PENDING",
        ),
    )
    op.create_table(
        "time_slots",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("office_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("slot_start", sa.Time(), nullable=False),
        sa.Column("slot_end", sa.Time(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column(
            "is_booked",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),  # 👈 default false makes more sense
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_table("appointments")
    op.drop_table("citizen_info")
