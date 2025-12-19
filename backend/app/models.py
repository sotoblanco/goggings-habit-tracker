from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
import datetime

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=generate_uuid)
    username = Column(String, unique=True, index=True)
    api_key = Column(String, nullable=True) # Encrypted or just stored? Stored for BYOK.

class Task(Base):
    __tablename__ = "tasks"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    date = Column(String, index=True) # YYYY-MM-DD
    description = Column(String)
    difficulty = Column(String)
    completed = Column(Boolean, default=False)
    category = Column(String)
    estimated_time = Column(Float)
    actual_time = Column(Float, nullable=True)
    story = Column(Text, nullable=True)
    recurring_master_id = Column(String, nullable=True)
    goal_alignment = Column(Float, nullable=True)
    aligned_goal_id = Column(String, ForeignKey("goals.id"), nullable=True)
    justification = Column(Text, nullable=True)
    time = Column(String, nullable=True)
    bet_amount = Column(Float, nullable=True)
    bet_multiplier = Column(Float, nullable=True)
    bet_placed = Column(Boolean, nullable=True)
    bet_won = Column(Boolean, nullable=True)
    recurrence_rule = Column(String, nullable=True)

class RecurringTask(Base):
    __tablename__ = "recurring_tasks"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    description = Column(String)
    difficulty = Column(String)
    category = Column(String)
    recurrence_rule = Column(String)
    start_date = Column(String)
    estimated_time = Column(Float)
    goal_alignment = Column(Float, nullable=True)
    aligned_goal_id = Column(String, ForeignKey("goals.id"), nullable=True)
    justification = Column(Text, nullable=True)
    time = Column(String, nullable=True)
    completions = Column(JSON, default={}) # JSON blob for completions history

class Goal(Base):
    __tablename__ = "goals"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    description = Column(String)
    target_date = Column(String)
    label = Column(String, nullable=True)
    completed = Column(Boolean, default=False)
    completion_date = Column(String, nullable=True)
    completion_proof = Column(Text, nullable=True)
    completion_feedback = Column(Text, nullable=True)
    system = Column(JSON, nullable=True) # JSON blob for Atomic Habits system
    contract = Column(JSON, nullable=True) # JSON blob for contract

class WeeklyGoal(Base):
    __tablename__ = "weekly_goals"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    description = Column(String)
    target_date = Column(String)
    aligned_goal_id = Column(String, ForeignKey("goals.id"), nullable=True)
    goal_alignment = Column(Float, nullable=True)
    label = Column(String, nullable=True)
    evaluation = Column(JSON, nullable=True)
    contract = Column(JSON, nullable=True)

class SideQuest(Base):
    __tablename__ = "side_quests"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    description = Column(String)
    difficulty = Column(String)
    daily_goal = Column(Integer)
    completions = Column(JSON, default={})

class Reward(Base):
    __tablename__ = "rewards"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String)
    cost = Column(Float)

class PurchasedReward(Base):
    __tablename__ = "purchased_rewards"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    reward_id = Column(String, ForeignKey("rewards.id"))
    name = Column(String)
    cost = Column(Float)
    purchase_date = Column(String)

class DiaryEntry(Base):
    __tablename__ = "diary_entries"
    # Composite PK? Or just date + user_id?
    # Keeping date as PK makes it hard for multi-user unless composite.
    # Changing to internal ID or composite PK.
    # Simplest: ID PK, date indexed. Or Composite (user_id, date).
    # Since existing logic uses date as ID for updates, let's keep date but make it NOT PK?
    # No, logic uses `where(date == ...)`.
    # Let's add ID and make date just a column, OR use composite.
    # SQLAlchemy composite PK:
    date = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    initial_reflection = Column(Text, nullable=True)
    initial_feedback = Column(Text, nullable=True)
    debrief = Column(Text, nullable=True)
    final_feedback = Column(Text, nullable=True)
    grade = Column(String, nullable=True)

class Character(Base):
    __tablename__ = "character"
    id = Column(String, ForeignKey("users.id"), primary_key=True) # 1:1 with User
    spent = Column(Float, default=0)
    bonuses = Column(Float, default=0)

class Wish(Base):
    __tablename__ = "wish_list"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    description = Column(String)
    explanation = Column(Text, nullable=True)
    label = Column(Text, nullable=True)

class CoreTask(Base):
    __tablename__ = "core_list"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    description = Column(String)
    explanation = Column(Text, nullable=True)
    label = Column(Text, nullable=True)
