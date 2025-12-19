import os
from dotenv import load_dotenv
# Load environment variables from .env file at the very start
load_dotenv()
# Also try project root if not found (e.g. when running from backend/ subdir)
if not os.getenv("GEMINI_API_KEY"):
    load_dotenv("../.env") 
    load_dotenv("../../.env")
    load_dotenv("../../../.env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, tasks, goals, ai, resources

app = FastAPI(title="Goggins Habit Tracker API", version="1.0.0")

# CORS (Allow frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(goals.router, prefix="/api")
app.include_router(resources.router, prefix="/api")
app.include_router(ai.router, prefix="/api")

@app.get("/api")
async def root_api():
    return {"message": "Welcome to the Goggins Habit Tracker API. Stay Hard!"}

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Serve Static Files (Frontend)
if os.path.isdir("app/static"):
    # Mount assets
    if os.path.isdir("app/static/assets"):
        app.mount("/assets", StaticFiles(directory="app/static/assets"), name="assets")
    
    # Catch-all for SPA
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Serve file if it exists (e.g., favicon.ico, robot.txt)
        file_path = f"app/static/{full_path}"
        if os.path.isfile(file_path):
            return FileResponse(file_path)
            
        # Fallback to index.html
        return FileResponse("app/static/index.html")
else:
    @app.get("/")
    async def root_fallback():
        return {"message": "Frontend not deployed. API is at /api"}
