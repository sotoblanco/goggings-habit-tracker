from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app import schemas, models
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(tags=["Tasks"])

# --- Tasks ---
@router.get("/tasks", response_model=List[schemas.Task])
async def get_tasks(
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None, 
    db: AsyncSession = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    query = select(models.Task).where(models.Task.user_id == user.id)
    if start_date and end_date:
        query = query.where(models.Task.date >= start_date, models.Task.date <= end_date)
    
    result = await db.execute(query)
    tasks = result.scalars().all()
    return tasks

@router.post("/tasks", response_model=schemas.Task, status_code=201)
async def create_task(task: schemas.Task, db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    # Standard Pydantic model dump uses the field names (snake_case) which match the DB model
    task_data = task.model_dump()
    db_task = models.Task(**task_data, user_id=user.id)
    db.add(db_task)
    await db.commit()
    await db.refresh(db_task)
    return db_task

@router.put("/tasks/{id}", response_model=schemas.Task)
async def update_task(id: str, task: schemas.Task, db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    result = await db.execute(select(models.Task).where(models.Task.id == id, models.Task.user_id == user.id))
    db_task = result.scalars().first()
    
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update fields
    task_data = task.model_dump(exclude_unset=True)
    for key, value in task_data.items():
        if hasattr(db_task, key):
            setattr(db_task, key, value)
    
    await db.commit()
    await db.refresh(db_task)
    return db_task

@router.delete("/tasks/{id}", status_code=204)
async def delete_task(id: str, db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    result = await db.execute(select(models.Task).where(models.Task.id == id, models.Task.user_id == user.id))
    db_task = result.scalars().first()
    if db_task:
        await db.delete(db_task)
        await db.commit()
    return

# --- Recurring Tasks ---
@router.get("/recurring-tasks", response_model=List[schemas.RecurringTask])
async def get_recurring_tasks(db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    result = await db.execute(select(models.RecurringTask).where(models.RecurringTask.user_id == user.id))
    return result.scalars().all() 

@router.post("/recurring-tasks", response_model=schemas.RecurringTask, status_code=201)
async def create_recurring_task(task: schemas.RecurringTask, db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    db_task = models.RecurringTask(**task.model_dump(), user_id=user.id)
    db.add(db_task)
    await db.commit()
    await db.refresh(db_task)
    return db_task

@router.put("/recurring-tasks/{id}", response_model=schemas.RecurringTask)
async def update_recurring_task(id: str, task: schemas.RecurringTask, db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    result = await db.execute(select(models.RecurringTask).where(models.RecurringTask.id == id, models.RecurringTask.user_id == user.id))
    db_task = result.scalars().first()
    
    if not db_task:
        raise HTTPException(status_code=404, detail="Recurring Task not found")
    
    task_data = task.model_dump(exclude_unset=True)
    for key, value in task_data.items():
        if hasattr(db_task, key):
            setattr(db_task, key, value)
        
    await db.commit()
    await db.refresh(db_task)
    return db_task

# --- Side Quests ---
@router.get("/side-quests", response_model=List[schemas.SideQuest])
async def get_side_quests(db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    result = await db.execute(select(models.SideQuest).where(models.SideQuest.user_id == user.id))
    return result.scalars().all()

@router.post("/side-quests", response_model=schemas.SideQuest, status_code=201)
async def create_side_quest(quest: schemas.SideQuest, db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    db_quest = models.SideQuest(**quest.model_dump(), user_id=user.id)
    db.add(db_quest)
    await db.commit()
    await db.refresh(db_quest)
    return db_quest

@router.put("/side-quests/{id}", response_model=schemas.SideQuest)
async def update_side_quest(id: str, quest: schemas.SideQuest, db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    result = await db.execute(select(models.SideQuest).where(models.SideQuest.id == id, models.SideQuest.user_id == user.id))
    db_quest = result.scalars().first()
    
    if not db_quest:
        raise HTTPException(status_code=404, detail="Side Quest not found")
        
    quest_data = quest.model_dump(exclude_unset=True)
    for key, value in quest_data.items():
        if hasattr(db_quest, key):
             setattr(db_quest, key, value)
        
    try:
        await db.commit()
        await db.refresh(db_quest)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"ERROR committing side quest update: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
    return db_quest

@router.delete("/side-quests/{id}", status_code=204)
async def delete_side_quest(id: str, db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    result = await db.execute(select(models.SideQuest).where(models.SideQuest.id == id, models.SideQuest.user_id == user.id))
    db_quest = result.scalars().first()
    if db_quest:
        await db.delete(db_quest)
        await db.commit()
    return

# --- Wish List ---
@router.get("/wish-list", response_model=List[schemas.Wish])
async def get_wishinfos(db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    result = await db.execute(select(models.Wish).where(models.Wish.user_id == user.id))
    return result.scalars().all()

@router.post("/wish-list", response_model=schemas.Wish, status_code=201)
async def create_wish(wish: schemas.Wish, db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    db_wish = models.Wish(**wish.model_dump(), user_id=user.id)
    db.add(db_wish)
    await db.commit()
    await db.refresh(db_wish)
    return db_wish

@router.delete("/wish-list/{id}", status_code=204)
async def delete_wish(id: str, db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    result = await db.execute(select(models.Wish).where(models.Wish.id == id, models.Wish.user_id == user.id))
    db_wish = result.scalars().first()
    if db_wish:
        await db.delete(db_wish)
        await db.commit()
    return

# --- Core List ---
@router.get("/core-list", response_model=List[schemas.CoreTask])
async def get_core_tasks(db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    result = await db.execute(select(models.CoreTask).where(models.CoreTask.user_id == user.id))
    return result.scalars().all()

@router.post("/core-list", response_model=schemas.CoreTask, status_code=201)
async def create_core_task(task: schemas.CoreTask, db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    db_task = models.CoreTask(**task.model_dump(), user_id=user.id)
    db.add(db_task)
    await db.commit()
    await db.refresh(db_task)
    return db_task

@router.delete("/core-list/{id}", status_code=204)
async def delete_core_task(id: str, db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    result = await db.execute(select(models.CoreTask).where(models.CoreTask.id == id, models.CoreTask.user_id == user.id))
    db_task = result.scalars().first()
    if db_task:
        await db.delete(db_task)
        await db.commit()
    return
