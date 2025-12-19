import pytest
import asyncio
import os
# Must set before importing app components
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test.db"
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import engine, Base
from app import models

# Recreate DB for tests
async def init_test_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

@pytest.mark.asyncio
async def test_register_and_login():
    await init_test_db()
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Register
        response = await ac.post("/auth/register", json={"username": "testuser", "api_key": "secret"})
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["username"] == "testuser"
        user_id = data["user"]["id"]

        # 2. Login
        response = await ac.post("/auth/login", json={"username": "testuser"})
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["id"] == user_id
        
        # 3. Login with auto-create (mock logic) - different user
        response = await ac.post("/auth/login", json={"username": "newuser"})
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["username"] == "newuser"
        assert data["user"]["id"] != user_id
    
    await engine.dispose()

if __name__ == "__main__":
    # Manually run the test function if executed as script
    try:
        asyncio.run(test_register_and_login())
        print("Test Passed: Register and Login working.")
    except Exception as e:
        print(f"Test Failed: {e}")
        import traceback
        traceback.print_exc()
