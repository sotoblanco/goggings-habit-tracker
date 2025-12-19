from fastapi import APIRouter, HTTPException, Depends
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app import schemas, models
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(tags=["Goals"])

# --- Goals ---
@router.get("/goals", response_model=List[schemas.Goal])
async def get_goals(db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    result = await db.execute(select(models.Goal).where(models.Goal.user_id == user.id))
    return result.scalars().all()

@router.post("/goals", response_model=schemas.Goal, status_code=201)
async def create_goal(goal: schemas.Goal, db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    db_goal = models.Goal(**goal.model_dump(), user_id=user.id)
    db.add(db_goal)
    await db.commit()
    await db.refresh(db_goal)
    return db_goal

@router.put("/goals/{id}", response_model=schemas.Goal)
async def update_goal(id: str, goal: schemas.Goal, db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    result = await db.execute(select(models.Goal).where(models.Goal.id == id, models.Goal.user_id == user.id))
    db_goal = result.scalars().first()
    
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    goal_data = goal.model_dump(exclude_unset=True)
    for key, value in goal_data.items():
        setattr(db_goal, key, value)
        
    await db.commit()
    await db.refresh(db_goal)
    return db_goal

@router.delete("/goals/{id}", status_code=204)
async def delete_goal(id: str, db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    result = await db.execute(select(models.Goal).where(models.Goal.id == id, models.Goal.user_id == user.id))
    db_goal = result.scalars().first()
    if db_goal:
        await db.delete(db_goal)
        await db.commit()
    return

# --- Weekly Goals ---
@router.get("/weekly-goals", response_model=List[schemas.WeeklyGoal])
async def get_weekly_goals(db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    result = await db.execute(select(models.WeeklyGoal).where(models.WeeklyGoal.user_id == user.id))
    return result.scalars().all()

@router.post("/weekly-goals", response_model=schemas.WeeklyGoal, status_code=201)
async def create_weekly_goal(goal: schemas.WeeklyGoal, db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    db_goal = models.WeeklyGoal(**goal.model_dump(), user_id=user.id)
    db.add(db_goal)
    await db.commit()
    await db.refresh(db_goal)
    return db_goal

@router.put("/weekly-goals/{id}", response_model=schemas.WeeklyGoal)
async def update_weekly_goal(id: str, goal: schemas.WeeklyGoal, db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    result = await db.execute(select(models.WeeklyGoal).where(models.WeeklyGoal.id == id, models.WeeklyGoal.user_id == user.id))
    db_goal = result.scalars().first()
    
    if not db_goal:
        raise HTTPException(status_code=404, detail="Weekly Goal not found")
    
    goal_data = goal.model_dump(exclude_unset=True)
    for key, value in goal_data.items():
        setattr(db_goal, key, value)
        
    await db.commit()
    await db.refresh(db_goal)
    return db_goal

@router.delete("/weekly-goals/{id}", status_code=204)
async def delete_weekly_goal(id: str, db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    result = await db.execute(select(models.WeeklyGoal).where(models.WeeklyGoal.id == id, models.WeeklyGoal.user_id == user.id))
    db_goal = result.scalars().first()
    if db_goal:
        await db.delete(db_goal)
        await db.commit()
    return
