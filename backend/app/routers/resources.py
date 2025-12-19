from fastapi import APIRouter, HTTPException, Depends, Header
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app import schemas, models
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(tags=["Resources"])

# --- Rewards ---
@router.get("/rewards", response_model=List[schemas.Reward])
async def get_rewards(db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    result = await db.execute(select(models.Reward).where(models.Reward.user_id == user.id))
    return result.scalars().all()

@router.post("/rewards", response_model=schemas.Reward, status_code=201)
async def create_reward(reward: schemas.Reward, db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    db_reward = models.Reward(**reward.model_dump(), user_id=user.id)
    db.add(db_reward)
    await db.commit()
    await db.refresh(db_reward)
    return db_reward

@router.delete("/rewards/{id}", status_code=204)
async def delete_reward(id: str, db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    result = await db.execute(select(models.Reward).where(models.Reward.id == id, models.Reward.user_id == user.id))
    db_reward = result.scalars().first()
    if db_reward:
        await db.delete(db_reward)
        await db.commit()

# --- Purchased Rewards ---
@router.get("/purchased-rewards", response_model=List[schemas.PurchasedReward])
async def get_purchased_rewards(db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    result = await db.execute(select(models.PurchasedReward).where(models.PurchasedReward.user_id == user.id))
    return result.scalars().all()

@router.post("/purchased-rewards", response_model=schemas.PurchasedReward, status_code=201)
async def create_purchased_reward(reward: schemas.PurchasedReward, db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    db_reward = models.PurchasedReward(**reward.model_dump(), user_id=user.id)
    db.add(db_reward)
    await db.commit()
    await db.refresh(db_reward)
    return db_reward

# --- Diary Entries ---
@router.get("/diary-entries", response_model=List[schemas.DiaryEntry])
async def get_diary_entries(db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    result = await db.execute(select(models.DiaryEntry).where(models.DiaryEntry.user_id == user.id))
    return result.scalars().all()

@router.post("/diary-entries", response_model=schemas.DiaryEntry, status_code=201)
async def create_diary_entry(entry: schemas.DiaryEntry, db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    # Check if exists for date AND user_id.
    result = await db.execute(select(models.DiaryEntry).where(models.DiaryEntry.date == entry.date, models.DiaryEntry.user_id == user.id))
    existing = result.scalars().first()
    
    if existing:
        entry_data = entry.model_dump(exclude_unset=True)
        for key, value in entry_data.items():
            setattr(existing, key, value)
        await db.commit()
        await db.refresh(existing)
        return existing
    
    db_entry = models.DiaryEntry(**entry.model_dump(), user_id=user.id)
    db.add(db_entry)
    await db.commit()
    await db.refresh(db_entry)
    return db_entry

@router.put("/diary-entries/{date}", response_model=schemas.DiaryEntry)
async def update_diary_entry(date: str, entry: schemas.DiaryEntry, db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    result = await db.execute(select(models.DiaryEntry).where(models.DiaryEntry.date == date, models.DiaryEntry.user_id == user.id))
    db_entry = result.scalars().first()
    
    if not db_entry:
        # Create it (upsert logic basically)
        db_entry = models.DiaryEntry(**entry.model_dump(), user_id=user.id)
        db.add(db_entry)
        await db.commit()
        await db.refresh(db_entry)
        return db_entry
        
    entry_data = entry.model_dump(exclude_unset=True)
    for key, value in entry_data.items():
        setattr(db_entry, key, value)
        
    await db.commit()
    await db.refresh(db_entry)
    return db_entry

# --- Character ---
@router.get("/character", response_model=schemas.Character)
async def get_character(db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):    
    result = await db.execute(select(models.Character).where(models.Character.id == user.id))
    char = result.scalars().first()
    
    if not char:
        # Should persist one
        char = models.Character(id=user.id, spent=0.0, bonuses=0.0)
        db.add(char)
        await db.commit()
        await db.refresh(char)
    return char

@router.put("/character", response_model=schemas.Character)
async def update_character(char: schemas.Character, db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    result = await db.execute(select(models.Character).where(models.Character.id == user.id))
    db_char = result.scalars().first()
    
    if not db_char:
        db_char = models.Character(id=user.id, spent=char.spent, bonuses=char.bonuses)
        db.add(db_char)
    else:
        db_char.spent = char.spent
        db_char.bonuses = char.bonuses
        
    try:
        await db.commit()
        await db.refresh(db_char)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"ERROR committing character update: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    return db_char
