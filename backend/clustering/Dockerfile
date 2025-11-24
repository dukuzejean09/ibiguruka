# Python DBSCAN Service Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy script
COPY dbscan.py .
COPY clustering_service.py .

# Run the service
CMD ["python", "clustering_service.py"]
