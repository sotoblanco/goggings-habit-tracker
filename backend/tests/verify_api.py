import sys
import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_auth():
    print("Testing Auth...")
    # Register
    reg_payload = {"username": "goggins_fan", "api_key": "test_key"}
    response = client.post("/auth/register", json=reg_payload)
    if response.status_code != 200:
        print(f"FAILED: Register - {response.text}")
        return None
    data = response.json()
    token = data["token"]
    user_id = data["user"]["id"]
    print("PASSED: Register")

    # Login
    login_payload = {"username": "goggins_fan"}
    response = client.post("/auth/login", json=login_payload)
    if response.status_code != 200:
        print(f"FAILED: Login - {response.text}")
    else:
        print("PASSED: Login")
    
    return token

def test_tasks():
    print("\nTesting Tasks...")
    task_id = str(uuid.uuid4())
    task_payload = {
        "id": task_id,
        "date": "2023-10-27",
        "description": "Run 10 miles",
        "difficulty": "Savage",
        "completed": False,
        "category": "Physical Training",
        "estimatedTime": 60
    }
    
    # Create
    response = client.post("/tasks", json=task_payload)
    if response.status_code == 201:
        print("PASSED: Create Task")
    else:
        print(f"FAILED: Create Task - {response.text}")
    
    # Get
    response = client.get("/tasks")
    if response.status_code == 200 and len(response.json()) > 0:
         print("PASSED: Get Tasks")
    else:
         print(f"FAILED: Get Tasks - {response.text}")
    
    # Update
    task_payload["completed"] = True
    response = client.put(f"/tasks/{task_id}", json=task_payload)
    if response.status_code == 200:
        print("PASSED: Update Task")
    else:
        print(f"FAILED: Update Task - {response.text}")
    
    # Delete
    response = client.delete(f"/tasks/{task_id}")
    if response.status_code == 204:
        print("PASSED: Delete Task")
    else:
        print(f"FAILED: Delete Task - {response.text}")

def test_goals():
    print("\nTesting Goals...")
    goal_id = str(uuid.uuid4())
    goal_payload = {
        "id": goal_id,
        "description": "Master Python",
        "targetDate": "2024-01-01"
    }
    
    # Create
    response = client.post("/goals", json=goal_payload)
    if response.status_code == 201:
        print("PASSED: Create Goal")
    else:
        print(f"FAILED: Create Goal - {response.text}")
        
    # Get
    response = client.get("/goals")
    if response.status_code == 200:
        print("PASSED: Get Goals")

def test_ai():
    print("\nTesting AI...")
    # Story
    story_payload = {
        "task": {
            "id": "1",
            "date": "2023-10-27",
            "description": "test",
            "difficulty": "Hard",
            "completed": False,
            "category": "Test",
            "estimatedTime": 10
        },
        "goals": []
    }
    response = client.post("/ai/story", json=story_payload)
    if response.status_code == 200:
        print(f"PASSED: AI Story - {response.json()['story']}")
    else:
        print(f"FAILED: AI Story - {response.text}")

def run_verification():
    print("--- Starting API Verification ---")
    try:
        token = test_auth()
        if token:
            test_tasks()
            test_goals()
            test_ai()
        print("--- Verification Complete ---")
    except Exception as e:
        print(f"An error occurred: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_verification()
