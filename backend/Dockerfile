FROM python:3.11-slim

WORKDIR /app

# Prevent Python from writing pyc files and buffering stdout
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system dependencies if required by some python packages (like psycopg2 if it ever comes back)
# RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5001

# Start the Flask app using Gunicorn with multithreading to prevent slow-client freezes
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--workers", "3", "--threads", "4", "app:app"]
