import httpx
import uuid
import asyncio

BASE_URL = "http://127.0.0.1:8000"

async def test_live_signup():
    username = f"user_{uuid.uuid4().hex[:8]}"
    print(f"Attempting to register user: {username}")
    
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        try:
            response = await client.post("/auth/register", json={
                "username": username,
                "api_key": "some-key"
            })
            
            print(f"Status Code: {response.status_code}")
            print(f"Response Body: {response.text}")
            
            if response.status_code == 200:
                print("SUCCESS: Signup worked.")
            else:
                print("FAILURE: Signup failed.")
        except Exception as e:
            print(f"EXCEPTION: {e}")

if __name__ == "__main__":
    asyncio.run(test_live_signup())
