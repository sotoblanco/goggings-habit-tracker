from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import date

# --- Enums ---
class TaskDifficulty(str, Enum):
    Easy = "Easy"
    Medium = "Medium"
    Hard = "Hard"
    Savage = "Savage"

class RecurrenceRule(str, Enum):
    Daily = "Daily"
    Weekly = "Weekly"
    Weekdays = "Weekdays"
    Weekends = "Weekends"
    None_ = "None" 

class GoalType(str, Enum):
    Internal_Metric = 'Internal Metric'
    External_Metric = 'External Metric'

# --- Shared Models ---
class User(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    username: str
    api_key: Optional[str] = Field(None, alias="apiKey") # Frontend might expect camel? Or snake? "api_key" in DB. "user.api_key" in frontend. TS type says api_key. Checking TS types...

class LoginRequest(BaseModel):
    username: str
    password: Optional[str] = None
    api_key: Optional[str] = None # Input

class UserUpdate(BaseModel):
    api_key: Optional[str] = None

class AuthResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    token: str
    user: User

# --- Core Data Models ---
# Note: Using snake_case for internal fields (matching DB), alias for JSON (camelCase context)
# BUT User/Login models previously used snake_case in TS? "api_key".
# Tasks used camelCase. "estimatedTime".

class Task(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: str
    date: str 
    description: str
    difficulty: TaskDifficulty
    completed: bool
    category: str
    estimated_time: float = Field(alias="estimatedTime")
    actual_time: Optional[float] = Field(None, alias="actualTime")
    story: Optional[str] = None
    recurring_master_id: Optional[str] = Field(None, alias="recurringMasterId")
    goal_alignment: Optional[float] = Field(None, alias="goalAlignment")
    aligned_goal_id: Optional[str] = Field(None, alias="alignedGoalId")
    justification: Optional[str] = None
    time: Optional[str] = None
    bet_amount: Optional[float] = Field(None, alias="betAmount")
    bet_multiplier: Optional[float] = Field(None, alias="betMultiplier")
    bet_placed: Optional[bool] = Field(None, alias="betPlaced")
    bet_won: Optional[bool] = Field(None, alias="betWon")
    recurrence_rule: Optional[RecurrenceRule] = Field(None, alias="recurrenceRule")

class RecurringTask(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: str
    description: str
    difficulty: TaskDifficulty
    category: str
    recurrence_rule: RecurrenceRule = Field(alias="recurrenceRule")
    start_date: str = Field(alias="startDate")
    estimated_time: float = Field(alias="estimatedTime")
    goal_alignment: Optional[float] = Field(None, alias="goalAlignment")
    aligned_goal_id: Optional[str] = Field(None, alias="alignedGoalId")
    justification: Optional[str] = None
    time: Optional[str] = None
    completions: Dict[str, Dict[str, Any]] = {}

class GoalKPI(BaseModel):
    description: str
    type: GoalType
    target: str

class GoalContract(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    primary_objective: str = Field(alias="primaryObjective")
    contract_statement: str = Field(alias="contractStatement")
    reward_payout: float = Field(alias="rewardPayout")
    kpis: List[GoalKPI]
    pre_state_answers: List[Dict[str, str]] = Field(alias="preStateAnswers")
    five_whys: List[str] = Field(alias="fiveWhys")

class AtomicHabitsSuggestions(BaseModel):
    obvious: List[str]
    attractive: List[str]
    easy: List[str]
    satisfying: List[str]

class Goal(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: str
    description: str
    target_date: str = Field(alias="targetDate")
    label: Optional[str] = None
    completed: Optional[bool] = False
    completion_date: Optional[str] = Field(None, alias="completionDate")
    completion_proof: Optional[str] = Field(None, alias="completionProof")
    completion_feedback: Optional[str] = Field(None, alias="completionFeedback")
    system: Optional[AtomicHabitsSuggestions] = None
    contract: Optional[GoalContract] = None

class WeeklyGoalEvaluation(BaseModel):
    alignment_score: float = Field(alias="alignmentScore")
    feedback: str

class WeeklyGoal(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: str
    description: str
    target_date: str = Field(alias="targetDate")
    aligned_goal_id: Optional[str] = Field(None, alias="alignedGoalId")
    goal_alignment: Optional[float] = Field(None, alias="goalAlignment")
    label: Optional[str] = None
    evaluation: Optional[WeeklyGoalEvaluation] = None
    contract: Optional[GoalContract] = None

class SideQuest(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: str
    description: str
    difficulty: TaskDifficulty
    daily_goal: int = Field(alias="dailyGoal")
    completions: Dict[str, int] = {}

class Reward(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: str
    name: str
    cost: float

class PurchasedReward(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: str
    reward_id: str = Field(alias="rewardId")
    name: str
    cost: float
    purchase_date: str = Field(alias="purchaseDate")

class DiaryEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    date: str
    initial_reflection: Optional[str] = Field(None, alias="initialReflection")
    initial_feedback: Optional[str] = Field(None, alias="initialFeedback")
    debrief: Optional[str] = None
    final_feedback: Optional[str] = Field(None, alias="finalFeedback")
    grade: Optional[str] = None

class Character(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    spent: float = 0
    bonuses: float = 0

class Wish(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: str
    description: str
    explanation: Optional[str] = None
    label: Optional[str] = None

class CoreTask(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: str
    description: str
    explanation: Optional[str] = None
    label: Optional[str] = None

# --- AI Models ---
# For AI Request models, if they map to frontend inputs, they need aliases
class ReviewSuggestions(BaseModel):
    keep: List[str]
    remove: List[str]
    add: List[str]

class ReviewResult(BaseModel):
    good: List[str]
    bad: List[str]
    suggestions: ReviewSuggestions

class AIStoryRequest(BaseModel):
    task: Task
    goals: List[Goal]
    justification: Optional[str] = None

class AILabelRequest(BaseModel):
    text: str

class AIAnalyzeGoalAlignmentRequest(BaseModel):
    taskDescription: str = Field(alias="taskDescription") # Manual or snake? Probably came from dict.
    activeGoals: List[Goal] = Field(alias="activeGoals")

class AIReflectionFeedbackRequest(BaseModel):
    reflection: str
    goals: List[Goal]

class AIDiaryFeedbackRequest(BaseModel):
    debrief: Dict[str, Any] 
    goals: List[Goal]

class AIReviewRequest(BaseModel):
    reviewData: Dict[str, Any] = Field(alias="reviewData")
    goals: List[Goal]
    sideQuests: List[SideQuest] = Field(alias="sideQuests")

class AIGoalChangeVerdictRequest(BaseModel):
    justification: str
    currentGoal: str = Field(alias="currentGoal")

class AIGoalCompletionVerdictRequest(BaseModel):
    goalDescription: str = Field(alias="goalDescription")
    completionProof: str = Field(alias="completionProof")

class AIAtomicSystemRequest(BaseModel):
    newGoal: Goal = Field(alias="newGoal")
    allGoals: List[Goal] = Field(alias="allGoals")
    accomplishmentsSummary: Dict[str, Any] = Field(alias="accomplishmentsSummary")

class AIWeeklyBriefingRequest(BaseModel):
    previousWeekEvaluations: List[WeeklyGoalEvaluation] = Field(alias="previousWeekEvaluations")
    nextWeekGoals: List[WeeklyGoal] = Field(alias="nextWeekGoals")
    longTermGoals: List[Goal] = Field(alias="longTermGoals")

class AIEnhanceTextRequest(BaseModel):
    text: str
    type: str 

class AIChatRequest(BaseModel):
    messages: List[Dict[str, str]]

class AIGoalContractRequest(BaseModel):
    description: str
    type: str = "goal" # goal, weekly, wish, core

class AIBettingOddsRequest(BaseModel):
    description: str
    difficulty: TaskDifficulty
    category: str
    estimated_time: float = Field(alias="estimatedTime")
    context: Optional[Dict[str, Any]] = None

class AIWeeklyGoalEvaluationRequest(BaseModel):
    description: str
    completed_tasks: List[Dict[str, Any]] = Field(alias="completedTasks")
    purchased_rewards: List[Dict[str, Any]] = Field(alias="purchasedRewards")
