FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN pip install fastapi uvicorn python-multipart

# Copy the mock SMS server files
COPY mock_sms_server.py /app/
COPY index.html /app/

# Expose ports
EXPOSE 3001 3000

# Run the mock SMS server
CMD ["python", "mock_sms_server.py"]
