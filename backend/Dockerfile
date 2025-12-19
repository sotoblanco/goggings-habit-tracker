FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

# Set workspace
WORKDIR /app

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1

# Copy project files
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv sync --frozen --no-install-project --no-dev

# Copy application source
COPY . .

# Install the project itself
RUN uv sync --frozen --no-dev

# Expose port
EXPOSE 8000

# Set environment variables
ENV DATABASE_URL="postgresql+asyncpg://postgres:postgres@db:5432/goggins"
ENV PORT=8000

# Run migrations and start the application
CMD ["sh", "-c", "uv run alembic upgrade head && uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT --reload"]
