from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware

from app.admin.router import router as admin_router
from app.appointments.routers import appointment_router
from app.auth.router import router as auth_router
from app.config import get_settings
from app.database import database
from app.office_mgnt.router import hostavailableroutes
from app.office_mgnt.router import router as office_router
from app.status.routes import router as status_router
from app.views.routes import view_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: connect to database
    await database.connect()
    yield
    # Shutdown: disconnect from database
    await database.disconnect()


def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"


if settings.SENTRY_DSN and settings.ENVIRONMENT != "local":
    sentry_sdk.init(dsn=str(settings.SENTRY_DSN), enable_tracing=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id,
    lifespan=lifespan,
)

# Set all CORS enabled origins
# Strip trailing slashes as AnyUrl adds them but browsers send Origin without trailing slash
cors_origins = [str(origin).rstrip("/") for origin in settings.BACKEND_CORS_ORIGINS]
if cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Health check endpoint (no auth required)
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for Docker and load balancers."""
    return {"status": "healthy"}


# Include all routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(office_router, prefix=settings.API_V1_STR)
app.include_router(hostavailableroutes, prefix=settings.API_V1_STR)
app.include_router(appointment_router, prefix=settings.API_V1_STR)
app.include_router(view_router, prefix=settings.API_V1_STR)
app.include_router(status_router, prefix=settings.API_V1_STR)
