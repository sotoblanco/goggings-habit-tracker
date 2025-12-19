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
app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(goals.router)
app.include_router(resources.router)
app.include_router(ai.router)

@app.get("/")
async def root():
    return {"message": "Welcome to the Goggins Habit Tracker API. Stay Hard!"}
