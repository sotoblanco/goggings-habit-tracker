from fastapi import APIRouter, HTTPException, Depends
import os
from dotenv import load_dotenv
load_dotenv()
if not os.getenv("GEMINI_API_KEY"):
    load_dotenv("../.env")
    load_dotenv("../../.env")
    load_dotenv("../../../.env")

# Debug: Print if key is found (masked)
key = os.getenv("GEMINI_API_KEY")
if key:
    print(f"DEBUG: GEMINI_API_KEY found: {key[:4]}...{key[-4:]}")
else:
    print("DEBUG: GEMINI_API_KEY still not found in environment.")

import google.generativeai as genai
from app.schemas import (
    AIStoryRequest, AILabelRequest, AIAnalyzeGoalAlignmentRequest, 
    AIReflectionFeedbackRequest, AIDiaryFeedbackRequest, AIReviewRequest,
    AIGoalChangeVerdictRequest, AIGoalCompletionVerdictRequest, 
    AIAtomicSystemRequest, AIWeeklyBriefingRequest, AIEnhanceTextRequest,
    AIChatRequest, AtomicHabitsSuggestions, ReviewResult, WeeklyGoalEvaluation,
    AIGoalContractRequest, AIBettingOddsRequest, AIWeeklyGoalEvaluationRequest,
    GoalContract, GoalKPI
)
import json
from app.dependencies import get_current_user
from app import models

router = APIRouter(prefix="/ai", tags=["AI"])

# Initialize Gemini
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    print("WARNING: GEMINI_API_KEY not found in environment variables.")
else:
    genai.configure(api_key=API_KEY)

# Helper to get model
def get_model(user: models.User):
    key = user.api_key or os.getenv("GEMINI_API_KEY")
    if not key:
        raise HTTPException(status_code=400, detail="Gemini API Key missing")
    genai.configure(api_key=key)
    return genai.GenerativeModel('gemini-2.5-flash-lite')

def get_json_model(user: models.User):
    key = user.api_key or os.getenv("GEMINI_API_KEY")
    if not key:
        raise HTTPException(status_code=400, detail="Gemini API Key missing")
    genai.configure(api_key=key)
    return genai.GenerativeModel('gemini-2.5-flash-lite', generation_config={"response_mime_type": "application/json"})

GOGGINS_PERSONA = """
You are David Goggins. You are the hardest man alive. 
Your tone is intense, military, uncompromising, but ultimately supportive of growth through suffering.
You do not coddle. You do not accept excuses. You demand calloused minds.
Use phrases like "Stay hard", "Who's gonna carry the boats", "Merry Christmas", "Roger that", "Taking souls".
"""

@router.post("/story")
async def generate_story(request: AIStoryRequest, user: models.User = Depends(get_current_user)):
    try:
        model = get_model(user)
        prompt = f"""
        {GOGGINS_PERSONA}
        User: {user.username}
        Generate a very short, intense motivational story (max 3 sentences) for a user finding a task.
        Task: {request.task.description}
        Difficulty: {request.task.difficulty}
        Category: {request.task.category}
        Estimated Time: {request.task.estimated_time} mins.
        Justification: {request.justification or "None"}
        Goals: {[g.description for g in request.goals]}
        
        The story should be about overcoming the specific resistance of this task.
        """
        response = model.generate_content(prompt)
        return {"story": response.text.strip()}
    except Exception as e:
        print(f"AI Error: {e}")
        return {"story": f"Stay hard, {user.username}. The AI is offline, but you are not."}

@router.post("/label")
async def generate_label(request: AILabelRequest, user: models.User = Depends(get_current_user)):
    try:
        model = get_model(user)
        prompt = f"""
        Classify this text into one of these exact categories: 'Physical Training', 'Mental Fortitude', 'Discipline', 'Uncomfortable Zone', 'Side Quest', 'Recovery'.
        Text: "{request.text}"
        Return ONLY the category name.
        """
        response = model.generate_content(prompt)
        return {"label": response.text.strip().replace("'", "").replace('"', '')}
    except Exception as e:
        return {"label": "General"}

@router.post("/analyze-goal-alignment")
async def analyze_goal_alignment(request: AIAnalyzeGoalAlignmentRequest, user: models.User = Depends(get_current_user)):
    try:
        model = get_json_model(user)
        active_goals_str = "\n".join([f"- {g.id}: {g.description}" for g in request.activeGoals]) if request.activeGoals else "No active goals."
        prompt = f"""
        Analyze if this task aligns with any active goals.
        Task: "{request.taskDescription}"
        Active Goals:
        {active_goals_str}
        
        Return JSON with:
        - alignmentScore (1-10)
        - justification (Why?)
        - alignedGoalId (The ID of the aligned goal, or null)
        """
        response = model.generate_content(prompt)
        return json.loads(response.text)
    except Exception as e:
        print(f"Err: {e}")
        return {
            "alignmentScore": 5,
            "justification": "Analysis failed. Assuming neutral impact.",
            "alignedGoalId": None
        }

@router.post("/reflection-feedback")
async def reflection_feedback(request: AIReflectionFeedbackRequest, user: models.User = Depends(get_current_user)):
    try:
        model = get_model(user)
        prompt = f"""
        {GOGGINS_PERSONA}
        The user wrote this reflection for their morning briefing:
        "{request.reflection}"
        Goals: {[g.description for g in request.goals]}
        
        Give them intense feedback. 1-2 sentences.
        """
        response = model.generate_content(prompt)
        return {"feedback": response.text.strip()}
    except Exception as e:
        return {"feedback": "Good morning. Get after it. (Offline)"}

@router.post("/diary-feedback")
async def diary_feedback(request: AIDiaryFeedbackRequest, user: models.User = Depends(get_current_user)):
    try:
        model = get_json_model(user)
        debrief = request.debrief
        prompt = f"""
        {GOGGINS_PERSONA}
        Analyze this daily debrief.
        Morning Reflection: {debrief.get('initialReflection') or "N/A"}
        Debrief Entry: {debrief.get('debriefEntry')}
        Tasks Completed: {len([t for t in debrief.get('tasks', []) if t.get('completed')])}/{len(debrief.get('tasks', []))}
        Earnings: ${debrief.get('earnings')}
        
        Return JSON:
        - feedback (Intense Goggins commentary)
        - grade (A, B, C, D, or F)
        """
        response = model.generate_content(prompt)
        return json.loads(response.text)
    except Exception as e:
        return {"feedback": "Log received. Stay hard.", "grade": "N/A"}

@router.post("/review")
async def review(request: AIReviewRequest, user: models.User = Depends(get_current_user)):
    try:
        model = get_json_model(user)
        # simplified prompt
        prompt = f"""
        {GOGGINS_PERSONA}
        Review this performance.
        Data: {str(request.reviewData)}
        Goals: {[g.description for g in request.goals]}
        
        Return JSON:
        - good (List of strings, what they did well)
        - bad (List of strings, where they were weak)
        - suggestions (Object with 'keep', 'remove', 'add' lists of strings)
        """
        response = model.generate_content(prompt)
        return json.loads(response.text)
    except Exception as e:
        return {
            "good": ["You showed up"],
            "bad": ["Data unavailable"],
            "suggestions": {"keep": [], "remove": [], "add": []}
        }

@router.post("/goal-change-verdict")
async def goal_change_verdict(request: AIGoalChangeVerdictRequest, user: models.User = Depends(get_current_user)):
    try:
        model = get_json_model(user)
        prompt = f"""
        {GOGGINS_PERSONA}
        User says: "{request.justification}" for changing goal: "{request.currentGoal}"
        
        Is this a valid strategic pivot or cowardice?
        Return JSON:
        - approved (boolean)
        - feedback (string, intense criticism or approval)
        """
        response = model.generate_content(prompt)
        return json.loads(response.text)
    except Exception as e:
        return {"approved": False, "feedback": "System offline. Hold the line."}

@router.post("/goal-completion-verdict")
async def goal_completion_verdict(request: AIGoalCompletionVerdictRequest, user: models.User = Depends(get_current_user)):
    try:
        model = get_json_model(user)
        prompt = f"""
        {GOGGINS_PERSONA}
        User claims completion of: "{request.goalDescription}"
        Proof provided: "{request.completionProof}"
        
        Evaluate the truth.
        Return JSON:
        - approved (boolean)
        - feedback (string)
        """
        response = model.generate_content(prompt)
        return json.loads(response.text)
    except Exception as e:
        return {"approved": True, "feedback": "Logged. (Offline)"}

@router.post("/atomic-system")
async def atomic_system(request: AIAtomicSystemRequest, user: models.User = Depends(get_current_user)):
    try:
        model = get_json_model(user)
        prompt = f"""
        Generate Atomic Habits system (James Clear style) for goal: "{request.newGoal.description}".
        User context: {[g.description for g in request.allGoals]}
        Accomplishments so far: {str(request.accomplishmentsSummary)}
        Return JSON with 4 keys: obvious, attractive, easy, satisfying (each a list of strings).
        """
        response = model.generate_content(prompt)
        return json.loads(response.text)
    except Exception as e:
         return {
            "obvious": ["Define the goal clearly"],
            "attractive": ["Visualize success"],
            "easy": ["Start small"],
            "satisfying": ["Track progress"]
        }

@router.post("/weekly-briefing")
async def weekly_briefing(request: AIWeeklyBriefingRequest, user: models.User = Depends(get_current_user)):
    try:
        model = get_model(user)
        prompt = f"""
        {GOGGINS_PERSONA}
        Write a weekly briefing for {user.username}.
        Prev Week Evals: {str(request.previousWeekEvaluations)}
        Next Week Goals: {[g.description for g in request.nextWeekGoals]}
        Long Term Goals: {[g.description for g in request.longTermGoals]}
        
        Keep it short, brutal, and directive.
        """
        response = model.generate_content(prompt)
        return {"briefing": response.text.strip()}
    except Exception as e:
        return {"briefing": "New week. New war. Get after it."}

@router.post("/enhance-text")
async def enhance_text(request: AIEnhanceTextRequest, user: models.User = Depends(get_current_user)):
    try:
        model = get_model(user)
        prompt = f"""
        {GOGGINS_PERSONA}
        Rewrite this to be more intense, clearer, and harder.
        Text: "{request.text}"
        Type: {request.type}
        """
        response = model.generate_content(prompt)
        return {"enhanced_text": response.text.strip()}
    except Exception as e:
         return {"enhanced_text": request.text}

@router.post("/chat")
async def chat(request: AIChatRequest, user: models.User = Depends(get_current_user)):
    try:
        model = get_model(user)
        conversation = f"{GOGGINS_PERSONA}\nUser: {user.username}\n"
        for msg in request.messages[-10:]: # limit context
            role = "User" if msg.get("sender") == "user" else "David Goggins"
            conversation += f"{role}: {msg.get('content')}\n"
        
        conversation += "David Goggins:"
        
        response = model.generate_content(conversation)
        return {"response": response.text.strip()}
    except Exception as e:
        return {"response": "Radio silence. (Offline)"}

# --- NEW ENDPOINTS ---

@router.post("/contract")
async def generate_contract(request: AIGoalContractRequest, user: models.User = Depends(get_current_user)):
    try:
        model = get_json_model(user)
        prompt = f"""
        {GOGGINS_PERSONA}
        Generate a binding Goal Contract for: "{request.description}".
        Type: {request.type}
        
        Return JSON matching this schema:
        {{
            "primaryObjective": "string",
            "contractStatement": "intense goggins pledge",
            "rewardPayout": float (GP value),
            "kpis": [{{ "description": "string", "type": "Internal Metric" | "External Metric", "target": "string" }}],
            "preStateAnswers": [],
            "fiveWhys": ["string", "string", "string", "string", "string"]
        }}
        """
        response = model.generate_content(prompt)
        return json.loads(response.text)
    except Exception as e:
        print(f"Contract Error: {e}")
        return {
            "primaryObjective": request.description,
            "contractStatement": "I will not fail.",
            "rewardPayout": 100,
            "kpis": [],
            "preStateAnswers": [],
            "fiveWhys": ["Stub"] * 5
        }

@router.post("/betting-odds")
async def generate_betting_odds(request: AIBettingOddsRequest, user: models.User = Depends(get_current_user)):
    try:
        model = get_json_model(user)
        prompt = f"""
        {GOGGINS_PERSONA}
        Calculate betting odds for this task:
        Description: {request.description}
        Difficulty: {request.difficulty}
        Category: {request.category}
        Estimated Time: {request.estimated_time} mins
        Context: {str(request.context)}
        
        Return JSON:
        - multiplier (float, usually 1.5 to 5.0 depending on risk)
        - rationale (string, why these odds?)
        """
        response = model.generate_content(prompt)
        return json.loads(response.text)
    except Exception as e:
        return {"multiplier": 2.0, "rationale": "Standard risk. Get after it."}

@router.post("/evaluate-weekly")
async def evaluate_weekly(request: AIWeeklyGoalEvaluationRequest, user: models.User = Depends(get_current_user)):
    try:
        model = get_json_model(user)
        prompt = f"""
        {GOGGINS_PERSONA}
        Evaluate this weekly goal: "{request.description}"
        Completed tasks: {str(request.completed_tasks)}
        Rewards purchased: {str(request.purchased_rewards)}
        
        Return JSON:
        - alignmentScore (float 1-10)
        - feedback (string, brutal honesty)
        """
        response = model.generate_content(prompt)
        return json.loads(response.text)
    except Exception as e:
        return {"alignmentScore": 5, "feedback": "Evaluation offline. Keep grinding."}
