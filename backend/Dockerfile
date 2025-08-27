# Use the official Python image as the base image
FROM python:3.13-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app

# Set the working directory to /app
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Copy the pyproject.toml first to leverage Docker cache
COPY ./pyproject.toml ./

# Install the package in development mode
RUN pip install --upgrade pip && \
    pip install -e .

# Copy the rest of the application code
COPY . .

# The main application
#CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
CMD ["fastapi", "dev", "app/main.py"]
