from databases import Database
from fastapi import APIRouter, Depends, status

from app.admin.config import AdminLevel
from app.auth.dependencies import CurrentUser, require_role
from app.database import get_db
from app.status.schemas import AdminStats
from app.status.services import StatusService

router = APIRouter(prefix="/status", tags=["Status"])


@router.get(
    "/admin/stats",
    response_model=AdminStats,
    status_code=status.HTTP_200_OK,
    summary="Admin dashboard statistics",
)
async def get_admin_dashboard_stats(
    _admin: CurrentUser = Depends(require_role(AdminLevel.ADMIN)),
    db: Database = Depends(get_db),
):
    return await StatusService.get_admin_stats(db)

