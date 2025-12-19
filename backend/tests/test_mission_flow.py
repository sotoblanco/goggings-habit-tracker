import httpx
import asyncio
import uuid
from datetime import date

BASE_URL = "http://127.0.0.1:8000"

async def test_mission_flow():
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        # 1. Login/Register
        username = f"mission_test_{uuid.uuid4().hex[:8]}"
        resp = await client.post("/auth/register", json={"username": username})
        if resp.status_code != 200:
            print("Login failed")
            return
        token = resp.json()['token']
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Add Mission (Task)
        today = date.today().strftime("%Y-%m-%d")
        new_task = {
            "id": f"mission_{uuid.uuid4().hex[:8]}",
            "description": "Test Mission Alpha",
            "difficulty": "Medium",
            "date": today,
            "category": "Physical Training",
            "estimatedTime": 45,
            "recurrenceRule": "None",
            "completed": False,
        }
        print(f"Adding Mission for {today}...")
        task_resp = await client.post("/tasks", json=new_task, headers=headers)
        
        if task_resp.status_code in [200, 201]:
            saved_task = task_resp.json()
            print(f"Mission Added: {saved_task['id']}")
        else:
            print(f"Failed to add mission: {task_resp.text}")
            return

        # 3. Verify List
        print("Fetching tasks...")
        list_resp = await client.get("/tasks", headers=headers)
        tasks = list_resp.json()
        found = any(t['id'] == saved_task['id'] for t in tasks)
        if found:
            print("SUCCESS: Mission found in list.")
        else:
            print("FAILURE: Mission not in list.")

        # 4. Add Side Quest
        sq_payload = {
            "id": f"sq_{uuid.uuid4().hex[:8]}",
            "description": "Side Quest Test",
            "difficulty": "Easy",
            "dailyGoal": 1,
            "completions": {}
        }
        print("Adding Side Quest...")
        sq_resp = await client.post("/side-quests", json=sq_payload, headers=headers)
        sq = sq_resp.json()
        sq_id = sq['id']
        print(f"Side Quest Added: {sq_id}")

        # 5. Complete Side Quest (Update)
        # Note: Frontend sends the entire object with updated completions
        updated_sq = sq.copy()
        updated_sq['completions'] = {today: 1}
        
        print("Completing Side Quest...")
        update_resp = await client.put(f"/side-quests/{sq_id}", json=updated_sq, headers=headers)
        
        if update_resp.status_code == 200:
            print("Side Quest Updated.")
            # Verify persistence
            verify_sq = await client.get("/side-quests", headers=headers)
            server_sq = next((s for s in verify_sq.json() if s['id'] == sq_id), None)
            if server_sq and server_sq.get('completions', {}).get(today) == 1:
                print("SUCCESS: Side Quest completion persisted.")
            else:
                 print(f"FAILURE: Completion not saved. Got: {server_sq.get('completions') if server_sq else 'None'}")
        else:
            print(f"Failed to update Side Quest: {update_resp.text}")

if __name__ == "__main__":
    asyncio.run(test_mission_flow())
