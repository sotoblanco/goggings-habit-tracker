import pytest
import asyncio
import os
import uuid
# Must set before importing app components
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_ai.db"
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import engine, Base

import pytest_asyncio

@pytest_asyncio.fixture(scope="module")
async def client():
    # Setup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    
    # Teardown
    await engine.dispose()
    if os.path.exists("./test_ai.db"):
        os.remove("./test_ai.db")

@pytest.mark.asyncio
async def test_ai_integration_flow(client):
    # 1. Register a user to get a token
    username = f"ai_user_{uuid.uuid4().hex[:6]}"
    reg_resp = await client.post("/auth/register", json={"username": username})
    assert reg_resp.status_code == 200
    token = reg_resp.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Test AI Story Generation (Existing Endpoint)
    story_payload = {
        "task": {
            "id": "task-1",
            "date": "2023-12-18",
            "description": "Run 5 miles",
            "difficulty": "Hard",
            "completed": False,
            "category": "Physical",
            "estimatedTime": 45.0
        },
        "goals": [],
        "justification": "Stay hard"
    }
    story_resp = await client.post("/ai/story", json=story_payload, headers=headers)
    assert story_resp.status_code == 200
    data = story_resp.json()
    assert "story" in data
    # FAIL if we got the fallback
    assert "offline" not in data["story"].lower(), "AI returned fallback story - is API key missing?"
    print(f"\nAI Story Response: {data['story']}")

    # 3. Test AI Labeling
    label_resp = await client.post("/ai/label", json={"text": "Pushups until failure"}, headers=headers)
    assert label_resp.status_code == 200
    assert "label" in label_resp.json()
    print(f"AI Label Response: {label_resp.json()['label']}")

    # 4. Test AI Contract Generation (New Endpoint)
    contract_resp = await client.post("/ai/contract", json={"description": "Lose 5kg in 1 month", "type": "goal"}, headers=headers)
    assert contract_resp.status_code == 200
    contract_data = contract_resp.json()
    assert "primaryObjective" in contract_data
    assert "contractStatement" in contract_data
    # FAIL if we got the stub data (Five Whys: ["Stub", "Stub"...])
    assert "Stub" not in contract_data["fiveWhys"], "AI returned stub contract - is API key missing?"
    assert len(contract_data["fiveWhys"]) == 5
    print(f"AI Contract generated for: {contract_data['primaryObjective']}")

    # 5. Test AI Betting Odds (New Endpoint)
    bet_payload = {
        "description": "24 hour fast",
        "difficulty": "Savage",
        "category": "Discipline",
        "estimatedTime": 1440.0
    }
    bet_resp = await client.post("/ai/betting-odds", json=bet_payload, headers=headers)
    assert bet_resp.status_code == 200
    bet_data = bet_resp.json()
    assert "multiplier" in bet_data
    assert "rationale" in bet_data
    print(f"AI Betting Odds: {bet_data['multiplier']}x - {bet_data['rationale']}")

    # 6. Test Security (401 without token)
    sec_resp = await client.post("/ai/story", json=story_payload)
    assert sec_resp.status_code == 401

@pytest.mark.asyncio
async def test_ai_key_validation(client):
    # Register a new user
    username = f"key_test_{uuid.uuid4().hex[:6]}"
    reg_resp = await client.post("/auth/register", json={"username": username})
    token = reg_resp.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify that with an INVALID API key, the system fails the strict test
    # (Actually, we want to test if it "doesn't work". In our case, an invalid key
    # will trigger the fallback. We should assert that it DOES trigger an error if we were strict,
    # or assert it doesn't return fallback).
    
    # Let's update user with a garbage key
    await client.put("/auth/profile", json={"api_key": "invalid_key_123"}, headers=headers)
    
    resp = await client.post("/ai/label", json={"text": "Test"}, headers=headers)
    assert resp.status_code == 200
    # If the key is invalid, label returns "General" (the fallback)
    assert resp.json()["label"] != "General", "AI used fallback 'General' - API Key is invalid or not working."

if __name__ == "__main__":
    # If run as script, use pytest to run this file
    import sys
    sys.exit(pytest.main([__file__]))
