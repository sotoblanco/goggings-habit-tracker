import httpx
import asyncio

BASE_URL = "http://127.0.0.1:8000"

async def test_update_settings():
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        # 1. Login/Register
        username = "test_settings_user"
        initial_key = "initial_key_123"
        
        print("Registering...")
        resp = await client.post("/auth/register", json={"username": username, "api_key": initial_key})
        if resp.status_code == 400:
             print("User exists, logging in...")
             resp = await client.post("/auth/login", json={"username": username, "api_key": initial_key})
        
        data = resp.json()
        token = data['token']
        user_id = data['user']['id']
        print(f"Logged in as {username}, ID: {user_id}")
        print(f"Initial Key: {data['user'].get('api_key')}")

        # 2. Update Key
        new_key = "updated_key_999"
        print(f"Updating key to: {new_key}")
        
        update_resp = await client.put(f"/auth/me?token={token}", json={"api_key": new_key})
        print(f"Update Status: {update_resp.status_code}")
        
        if update_resp.status_code == 200:
            updated_user = update_resp.json()
            print(f"Updated User Key: {updated_user.get('api_key')}")
            assert updated_user.get('api_key') == new_key
            print("SUCCESS: API Key updated.")
        else:
            print(f"FAILURE: {update_resp.text}")

if __name__ == "__main__":
    asyncio.run(test_update_settings())
