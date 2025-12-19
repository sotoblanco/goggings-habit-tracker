import httpx
import asyncio
import uuid

BASE_URL = "http://127.0.0.1:8000"

async def test_funding():
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        # Create unique user
        username = f"recruit_{uuid.uuid4().hex[:8]}"
        print(f"Recruiting neophyte: {username}...")
        
        # Register (should fund with 5.0)
        # Note: We provide NO api_key to test the 'missing key' state for frontend too (implicitly)
        resp = await client.post("/auth/register", json={"username": username}) 
        if resp.status_code != 200:
            print(f"Registration Failed: {resp.text}")
            return

        data = resp.json()
        token = data['token']
        print(f"Token: {token}")

        # Check Character Funds
        # Need to use token in Header as per my fix
        headers = {"Authorization": f"Bearer {token}"}
        char_resp = await client.get("/character", headers=headers)
        
        if char_resp.status_code == 200:
            char = char_resp.json()
            funds = char.get('bonuses', 0)
            print(f"Funds found: ${funds}")
            
            if funds == 5.0:
                print("SUCCESS: Account funded with $5.00.")
            else:
                print(f"FAILURE: Expected $5.00, got ${funds}")
        else:
            print(f"FAILURE: Could not fetch character. {char_resp.text}")

if __name__ == "__main__":
    asyncio.run(test_funding())
