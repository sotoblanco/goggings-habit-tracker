# Stage 1: Build Frontend
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build frontend with API Base URL set to /api
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

# Stage 2: Backend + Final
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

WORKDIR /app

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1

# Copy backend dependency files
COPY backend/pyproject.toml backend/uv.lock ./

# Install dependencies
RUN uv sync --frozen --no-install-project --no-dev

# Copy backend source code structure
COPY backend/ ./

# Install the project itself
RUN uv sync --frozen --no-dev

# Copy built frontend assets to app/static
# Ensure the directory exists (COPY creates it)
COPY --from=frontend-build /app/frontend/dist ./app/static

# Expose port
EXPOSE 8000

# Set environment variables
ENV DATABASE_URL="postgresql+asyncpg://postgres:postgres@db:5432/goggins"
ENV PORT=8000

# Run migrations and start the application
CMD ["sh", "-c", "uv run alembic upgrade head && uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT"]
