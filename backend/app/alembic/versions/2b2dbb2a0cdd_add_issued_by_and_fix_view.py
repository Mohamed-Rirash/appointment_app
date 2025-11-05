"""add issued_by and fix view

Revision ID: 2b2dbb2a0cdd
Revises: 8097e9b9fb66
Create Date: 2025-09-29 07:22:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "2b2dbb2a0cdd"
down_revision: str | Sequence[str] | None = "8097e9b9fb66"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""

    # conn = op.get_bind()
    # inspector = sa.inspect(conn)
    #
    # # Check if column already exists
    # has_issued_by = any(
    #     c["name"] == "issued_by" for c in inspector.get_columns("appointments")
    # )
    #
    # # 1) Only add column if it doesn't exist
    # if not has_issued_by:
    #     op.add_column("appointments", sa.Column("issued_by", sa.UUID(), nullable=True))
    #
    # # 2) Check if foreign key already exists
    # fks = inspector.get_foreign_keys("appointments")
    # fk_exists = any(
    #     fk["referred_table"] == "users"
    #     and set(fk["constrained_columns"]) == {"issued_by"}
    #     for fk in fks
    # )
    #
    # if not fk_exists:
    #     op.create_foreign_key(
    #         "fk_appointments_issued_by_users",
    #         "appointments",
    #         "users",
    #         ["issued_by"],
    #         ["id"],
    #     )
    #
    # # 3) Backfill data from legacy created_by if it exists
    # if has_issued_by:
    #     has_created_by = any(
    #         c["name"] == "created_by" for c in inspector.get_columns("appointments")
    #     )
    #     if has_created_by:
    #         conn.execute(
    #             sa.text(
    #                 "UPDATE appointments SET issued_by = created_by WHERE issued_by IS NULL"
    #             )
    #         )
    #
    #     # 4) As a fallback, where issued_by is still NULL, set it to host_id (better than leaving NULL)
    #     conn.execute(
    #         sa.text(
    #             "UPDATE appointments SET issued_by = host_id WHERE issued_by IS NULL"
    #         )
    #     )
    #
    #     # 5) Only try to alter the column to NOT NULL if it's currently nullable
    #     column_info = next(
    #         (
    #             c
    #             for c in inspector.get_columns("appointments")
    #             if c["name"] == "issued_by"
    #         ),
    #         None,
    #     )
    #     if column_info and column_info["nullable"]:
    #         op.alter_column(
    #             "appointments",
    #             "issued_by",
    #             existing_type=sa.UUID(),
    #             nullable=False,
    #         )
    #
    # # 6) Drop legacy created_by column if it exists to align with the models
    # if has_created_by:
    #     # Find the actual FK constraint name for created_by -> users.id
    #     fks = inspector.get_foreign_keys("appointments")
    #     created_by_fk_name = None
    #     for fk in fks:
    #         if "created_by" in (fk.get("constrained_columns") or []):
    #             created_by_fk_name = fk.get("name")
    #             break
    #
    #     if created_by_fk_name:
    #         op.drop_constraint(created_by_fk_name, "appointments", type_="foreignkey")
    #
    #     # Finally drop the column
    #     op.drop_column("appointments", "created_by")
    #
    # # 7) Drop the existing view first to avoid column rename constraints, then recreate
    # op.execute("DROP VIEW IF EXISTS appointment_details")
    # op.execute(
    #     """
    #     CREATE OR REPLACE VIEW appointment_details AS
    #     SELECT
    #         users.id AS host_id,
    #         users.first_name,
    #         users.last_name,
    #         users.email,
    #         appointments.id AS appointment_id,
    #         appointments.purpose,
    #         appointments.appointment_date,
    #         appointments.time_slotted,
    #         appointments.status,
    #         appointments.is_active AS appointment_active,
    #         appointments.created_at,
    #         appointments.updated_at,
    #         appointments.canceled_at,
    #         appointments.canceled_reason AS reason,
    #         appointments.canceled_by,
    #         appointments.issued_by,
    #         appointments.office_id,
    #         appointments.decision_reason,
    #         appointments.decided_at,
    #         appointments.decided_by,
    #         appointments.new_appointment_date,
    #         citizen_info.id AS citizen_id,
    #         citizen_info.firstname AS citizen_firstname,
    #         citizen_info.lastname AS citizen_lastname,
    #         citizen_info.email AS citizen_email,
    #         citizen_info.phone AS citizen_phone
    #     FROM appointments
    #     JOIN users ON users.id = appointments.host_id
    #     JOIN citizen_info ON citizen_info.id = appointments.citizen_id
    #     """
    # )
    #


def downgrade() -> None:
    """Downgrade schema."""
    # 1) Drop the replaced view; the prior migration (8097e9b9fb66) will recreate it on downgrade chain

    # # 2) Re-add legacy created_by column (nullable) and FK for compatibility
    # op.add_column("appointments", sa.Column("created_by", sa.UUID(), nullable=True))
    # op.create_foreign_key(
    #     "appointments_created_by_fkey",
    #     "appointments",
    #     "users",
    #     ["created_by"],
    #     ["id"],
    # )
    #
    # # 3) Backfill created_by from issued_by
    # conn = op.get_bind()
    # conn.execute(
    #     sa.text(
    #         "UPDATE appointments SET created_by = issued_by WHERE created_by IS NULL"
    #     )
    # )
    #
    # # 4) Make created_by not null to match the original state
    # op.alter_column(
    #     "appointments", "created_by", existing_type=sa.UUID(), nullable=False
    # )
    #
    # # 5) Drop issued_by and its FK
    # op.drop_constraint(
    #     "fk_appointments_issued_by_users", "appointments", type_="foreignkey"
    # )
    # op.drop_column("appointments", "issued_by")
