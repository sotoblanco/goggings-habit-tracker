import os
import modal
from pathlib import Path

# Define the Modal App
app = modal.App("goggins-habit-tracker")

# Define a persistent Volume for the database
# This acts like a persistent disk, similar to Render's persistent disk
# We will use SQLite for simplicity and serverless compatibility, storing the DB file here.
volume = modal.Volume.from_name("goggins-data", create_if_missing=True)

# Define the container image with necessary dependencies
# Paths
BACKEND_DIR = Path(__file__).parent  # /home/.../backend
FRONTEND_DIST_DIR = BACKEND_DIR.parent / "frontend" / "dist"

# Check if frontend is built
if not FRONTEND_DIST_DIR.exists():
    print(f"WARNING: Frontend build not found at {FRONTEND_DIST_DIR}")
    print("Please run 'npm run build' in the frontend directory before deploying.")

# Define the container image with necessary dependencies
image = (
    modal.Image.debian_slim()
    # Install Python dependencies matching pyproject.toml
    .pip_install(
        "fastapi",
        "uvicorn",
        "sqlalchemy",
        "aiosqlite",
        "asyncpg",
        "pydantic",
        "pydantic-settings",
        "python-dotenv",
        "python-jose[cryptography]",
        "passlib[bcrypt]",
        "python-multipart",
        "google-genai",
        "httpx",
        "bcrypt==4.0.1"
    )
    # Add local files to the image (behaves like mounting in modern Modal)
    .add_local_dir(BACKEND_DIR / "app", remote_path="/root/app")
    .add_local_dir(FRONTEND_DIST_DIR, remote_path="/root/app/static")
)

@app.function(
    image=image,
    # Load secrets from the local .env file automatically
    secrets=[modal.Secret.from_dotenv(path=BACKEND_DIR.parent / ".env")], 
    volumes={"/data": volume},
)
@modal.asgi_app()
def web():
    # Configure the application to use the SQLite DB on the persistent volume
    os.environ["DATABASE_URL"] = "sqlite+aiosqlite:////data/goggins.db"
    
    # Import the FastAPI app
    from app.main import app as fastapi_app
    return fastapi_app

# Utility function to initialize the database tables
@app.function(
    image=image,
    secrets=[modal.Secret.from_dotenv(path=BACKEND_DIR.parent / ".env")], 
    volumes={"/data": volume},
)
def init_db():
    """Initializes the database tables on the persistent volume."""
    print("Initializing database...")
    os.environ["DATABASE_URL"] = "sqlite+aiosqlite:////data/goggins.db"
    
    from app.database import engine, Base
    # Import all models to ensure they are registered with Base
    from app.models import User, Task, Goal, WeeklyGoal, Character, DiaryEntry, Wish, CoreTask, Reward
    import asyncio
    
    async def _init():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        await engine.dispose()
            
    asyncio.run(_init())
    print("Database tables created successfully in /data/goggins.db")

@app.function(
    image=image,
    secrets=[modal.Secret.from_dotenv(path=BACKEND_DIR.parent / ".env")], 
    volumes={"/data": volume},
)
def inspect_data():
    """Inspects all user data in the database (Users, Character stats, Task counts)."""
    import sqlite3
    
    print("Querying detailed data from /data/goggins.db...\n")
    try:
        con = sqlite3.connect("/data/goggins.db")
        con.row_factory = sqlite3.Row
        cur = con.cursor()
        
        # Get all users
        cur.execute("SELECT * FROM users")
        users = cur.fetchall()
        
        if not users:
            print("No users found.")
            con.close()
            return

        for user in users:
            u_id = user["id"]
            username = user["username"]
            print(f"=== USER: {username} (ID: {u_id}) ===")
            
            # Character Stats
            cur.execute("SELECT * FROM character WHERE id = ?", (u_id,))
            char = cur.fetchone()
            if char:
                print(f"  [Character] XP/Spent: {char['spent']}, Bonuses: {char['bonuses']}")
            else:
                print("  [Character] No character data found.")

            # Counts
            cur.execute("SELECT COUNT(*) as count FROM tasks WHERE user_id = ?", (u_id,))
            task_count = cur.fetchone()['count']
            
            cur.execute("SELECT COUNT(*) as count FROM goals WHERE user_id = ?", (u_id,))
            goal_count = cur.fetchone()['count']
            
            cur.execute("SELECT COUNT(*) as count FROM diary_entries WHERE user_id = ?", (u_id,))
            diary_count = cur.fetchone()['count']
            
            print(f"  [Stats] Tasks: {task_count} | Goals: {goal_count} | Diary Entries: {diary_count}")
            print("-" * 60)

            # verify raw columns
            # print(f"  Raw User Data: {dict(user)}")
            print("")
                
        con.close()
    except Exception as e:
        print(f"Error querying database: {e}")
