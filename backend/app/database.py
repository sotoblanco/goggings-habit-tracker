from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
import os

# Database URL configuration
# Default to SQLite for easy dev, allow Postgres via ENV

# Calculate absolute path to backend/goggins.db to avoid CWD issues
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "goggins.db")
DEFAULT_DB_URL = f"sqlite+aiosqlite:///{DB_PATH}"

DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DB_URL)

# Engine options: for SQLite, we need to disable same_thread_check if we were using synchronous,
# but for aiosqlite it handles it.
# Echo=True logs SQL for debugging.
engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

# Shared SessionLocal class
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

# Base class for all ORM models
class Base(DeclarativeBase):
    pass

# Dependency for FastAPI Routers
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
