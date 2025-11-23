from databases import Database
from fastapi import APIRouter, Depends, status

from app.auth.dependencies import CurrentUser, require_authentication
from app.database import get_db
from app.status.schemas import AdminStats
from app.status.services import StatusService

router = APIRouter(prefix="/status", tags=["Status"])


@router.get(
    "/",
    response_model=AdminStats,
    status_code=status.HTTP_200_OK,
    summary="Admin dashboard statistics",
)
async def get_admin_dashboard_stats(
    user: CurrentUser = Depends(require_authentication),
    db: Database = Depends(get_db),
):
    return await StatusService.get_admin_stats(db)
