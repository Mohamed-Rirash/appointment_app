# Appointment Booking App

A production-ready FastAPI backend for an appointment booking application. It includes robust authentication, RBAC (roles and permissions), request/response caching, rate limiting, structured logging, email sending via SMTP, and a complete local development environment using Docker (Postgres, Redis, Mailpit, Adminer/pgAdmin).


## Tech Stack

- Python 3.12
- FastAPI + Uvicorn
- Pydantic v2 + pydantic-settings
- SQLAlchemy 2.x + Alembic (asyncpg)
- PostgreSQL (via Docker)
- Redis (caching + rate limiting)
- FastAPI-Mail (SMTP via Mailpit in dev)
- Pytest for tests
- Docker Compose for local infra


## Features

- JWT authentication with access tokens
- Role-based access control (RBAC) with bootstrap seeding
- CORS, security headers, size/time limits, and proxy headers
- Request logging and structured logs
- Response caching and Redis-backed rate limiting
- Healthcheck endpoint and optional OpenAPI docs in dev
- Email domain restrictions and SMTP integration (Mailpit in dev)


## Repository Structure (backend)

- `backend/app/main.py` – FastAPI app factory and middleware
- `backend/app/config.py` – App settings and environment variables
- `backend/app/database.py` – DB connection (async)
- `backend/app/auth/*` – Auth models, routes, utilities
- `backend/app/admin/*` – Admin routes (user/role management)
- `backend/app/core/*` – Middleware (caching, logging, security, errors)
- `backend/app/role_perm_seed.py` – RBAC bootstrap helpers
- `backend/alembic/*` – Database migrations setup
- `backend/tests/*` – Pytest suite
- `compose.yml` – Local infra (Postgres, Redis, Mailpit, Adminer, pgAdmin, Backend)


## Quickstart (Docker)

Prerequisites:

- Docker and Docker Compose installed

1) Create an `.env` file in the project root (same folder as `compose.yml`). You can start from the example below.
2) Start the stack:

   ```bash
docker compose up --build
```

3) Once running:

   - API: <http://localhost:8000/>
   - Docs (dev only): <http://localhost:8000/docs>
   - Health: <http://localhost:8000/health>
   - Adminer (DB UI): <http://localhost:8080/>
   - pgAdmin: <http://localhost:5050/>
   - Mailpit (SMTP UI): <http://localhost:8025/>

Note: The backend service automatically waits for the database, autogenerates an initial Alembic migration if none exist, upgrades to head, and starts Uvicorn with auto-reload.


## Example .env (root)

These values are read by both Docker Compose and the backend settings. Adjust as needed.

```env
SECRET_KEY=changethis
ENVIRONMENT=local

# Postgres
POSTGRES_USER=appuser
POSTGRES_PASSWORD=changethis
POSTGRES_DB=appointement_app

# Optional for pgAdmin
PGADMIN_DEFAULT_EMAIL=admin@example.com
PGADMIN_DEFAULT_PASSWORD=changethis

# Backend
FRONTEND_HOST=http://localhost:3000
API_V1_STR=/api/v1

# Redis (Docker service name)
REDIS_HOST=redis
REDIS_PORT=6379

# Email (Mailpit defaults)
MAIL_SERVER=mailpit
MAIL_PORT=1025
MAIL_FROM=noreply@test.com
MAIL_FROM_NAME=App
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_STARTTLS=false
MAIL_SSL_TLS=false
MAIL_DEBUG=true
SUPPRESS_SEND=false

# RBAC bootstrap on startup (safe/idempotent)
INIT_RBAC_ON_STARTUP=true

# First superuser (only used when bootstrapping)
FIRST_SUPERUSER=admin@example.com
FIRST_SUPERUSER_PASSWORD=changethis
```

## Running Locally Without Docker (advanced)

Prerequisites:

- Python 3.12
- PostgreSQL running locally
- Redis running locally

1) Create and activate a virtual environment in `backend/` and install deps:

   ```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .
```

2) Create a `.env` file in the project root or `backend/` with your DB and Redis settings (ensure `POSTGRES_SERVER=localhost`, etc.).

3) Initialize DB and run migrations from `backend/`:

   ```bash
alembic upgrade head
```

4) Start the app from `backend/`:

   ```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Common URLs

- API Root: <http://localhost:8000/>
- API Docs (dev): <http://localhost:8000/docs>
- Health: <http://localhost:8000/health>
- Adminer: <http://localhost:8080/>
- pgAdmin: <http://localhost:5050/>
- Mailpit UI: <http://localhost:8025/> (SMTP on 1025)


## Environment Variables (selected)

Defined in `backend/app/config.py`. Key ones include:

- PROJECT_NAME, ENVIRONMENT, API_V1_STR, FRONTEND_HOST
- SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
- POSTGRES_SERVER, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
- SQLALCHEMY_DATABASE_URI (computed)
- REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB, REDIS_SSL, CACHE_TTL, CACHE_PREFIX
- RATE_LIMIT_ENABLED, RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW, RATE_LIMIT_STORAGE_URL
- LOG_LEVEL, LOG_FORMAT, LOG_FILE, LOG_ROTATION, LOG_RETENTION, REQUEST_LOGGING
- ENABLE_METRICS
- API_KEYS_ENABLED
- INIT_RBAC_ON_STARTUP
- ENABLE_SECURITY_HEADERS, ALLOWED_HOSTS, TRUSTED_PROXIES, MAX_REQUEST_SIZE, REQUEST_TIMEOUT
- BACKEND_CORS_ORIGINS, USE_CREDENTIALS
- ALLOWED_EMAIL_DOMAINS, ENFORCE_EMAIL_DOMAIN
- MAIL_* settings (see example above)
- SENTRY_DSN, SENTRY_TRACES_Sample_Rate, SENTRY_ENVIRONMENT
- FIRST_SUPERUSER, FIRST_SUPERUSER_PASSWORD

Note: In non-local environments, defaults like SECRET_KEY/POSTGRES_PASSWORD value "changethis" are rejected for security.


## Migrations

Alembic is configured under `backend/alembic/`.

- Docker flow will auto-generate an initial revision if none exist, then apply `alembic upgrade head`.
- Manually create a revision: `alembic revision --autogenerate -m "your message"`
- Apply: `alembic upgrade head`


## Testing

Run from the `backend/` directory:

```bash
pytest -q
```


## API Overview

- Root: GET `/` – basic metadata
- Health: GET `/health`
- Auth: routes under `/api/v1/auth/*`
- Admin: routes under `/api/v1/admin/*` (minimal admin router for user/role management)

Docs are available at `/docs` and `/redoc` in local/dev environments.


## Production Notes

- Set `ENVIRONMENT=production` and provide strong values for `SECRET_KEY`, DB creds, and mail settings.
- Set proper `ALLOWED_HOSTS` and CORS (`BACKEND_CORS_ORIGINS`).
- Consider turning off `INIT_RBAC_ON_STARTUP` after bootstrap.
- Ensure Redis is reachable and secured if used across networks.
- Configure logging outputs and retention as needed.


## Troubleshooting

- If backend cannot reach DB/Redis, verify the service names and ports in `.env` and `compose.yml`.
- If Swagger docs do not appear, ensure `ENVIRONMENT` is `local` or `development`.
- Email not received? Check Mailpit UI at <http://localhost:8025/> and ensure SMTP points to `mailpit:1025` in dev.