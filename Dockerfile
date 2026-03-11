# ── Stage 1: Build React frontend ──────────────────────────
FROM node:20-slim AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci --silent
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Python backend + pre-baked EasyOCR models ──────
FROM python:3.11-slim

# System libs required by OpenCV / EasyOCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libsm6 libxext6 libxrender1 libgomp1 \
    libgl1 wget curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (Docker layer cache)
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download EasyOCR language models into image
# This avoids slow cold-starts; adds ~800MB to image but startup is instant
RUN python -c "import easyocr; r = easyocr.Reader(['ch_tra', 'ch_sim', 'en'], gpu=False); print('EasyOCR models ready')"

# Copy backend source
COPY backend/ ./backend/

# Copy pre-built React static files
COPY --from=frontend-build /frontend/build ./frontend/build

# Copy ML models (pkl files already trained)
# (they're inside backend/models/ already copied above)

# Create data directory for SQLite
RUN mkdir -p /app/backend/data

ENV PYTHONUNBUFFERED=1
ENV PORT=8080

EXPOSE 8080

CMD ["python", "backend/app.py"]
