FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1

WORKDIR /app/

# Install curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Install uv
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#installing-uv
COPY --from=ghcr.io/astral-sh/uv:0.5.11 /uv /uvx /bin/

# Place executables in the environment at the front of the path
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#using-the-environment
ENV PATH="/app/.venv/bin:$PATH"

# Compile bytecode
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#compiling-bytecode
ENV UV_COMPILE_BYTECODE=1

# uv Cache
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#caching
ENV UV_LINK_MODE=copy

# Install dependencies
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#intermediate-layers
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-project

ENV PYTHONPATH=/app

COPY scripts /app/scripts

COPY pyproject.toml uv.lock alembic.ini README.md /app/

COPY app /app/app

COPY tests /app/tests

# Sync the project
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#intermediate-layers
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync

# Run prestart script before starting the production server
# CMD ["bash", "-lc", "bash /app/scripts/prestart.sh && fastapi run --workers 4 --host 0.0.0.0 --port 8000 app/main.py"]
# CMD ["fastapi run --workers 4 --host 0.0.0.0 --port 8000 app/main.py"]
CMD ["fastapi", "run", "--workers", "4", "--host", "0.0.0.0", "--port", "8000", "app/main.py"]

