import httpx
import asyncio
import json
import uuid

BASE_URL = "http://127.0.0.1:8000"

async def test_story_generation():
    print("Testing AI Story Generation...")
    
    # Mock data adhering to schemas
    payload = {
        "task": {
            "id": str(uuid.uuid4()),
            "date": "2023-10-27",
            "description": "Run 10 miles",
            "difficulty": "Savage",
            "completed": False,
            "category": "Fitness",
            "estimatedTime": 90.0
        },
        "goals": [
            {
                "id": str(uuid.uuid4()),
                "description": "Run a Marathon",
                "targetDate": "2024-01-01",
                "completed": False
            }
        ],
        "justification": "I need to stay hard."
    }

    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        try:
            response = await client.post("/ai/story", json=payload)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Story: {data.get('story')}")
                print("SUCCESS: Story generated.")
            else:
                print(f"FAILURE: {response.text}")

        except Exception as e:
            print(f"EXCEPTION: {e}")

if __name__ == "__main__":
    asyncio.run(test_story_generation())
