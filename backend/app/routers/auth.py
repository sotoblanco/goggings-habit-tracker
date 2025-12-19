from fastapi import APIRouter, HTTPException, Depends, Header
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app import schemas, models
from app.database import get_db
from app.dependencies import get_current_user
from app.auth_utils import get_password_hash, verify_password
import uuid

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=schemas.AuthResponse)
async def register(request: schemas.LoginRequest, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    result = await db.execute(select(models.User).where(models.User.username == request.username))
    existing_user = result.scalars().first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    hashed_password = get_password_hash(request.password) if request.password else None
    
    new_user = models.User(
        id=str(uuid.uuid4()), 
        username=request.username, 
        hashed_password=hashed_password,
        api_key=request.api_key
    )
    db.add(new_user)
    await db.flush() # Ensure user is in DB before creating character
    
    # Fund new account
    new_char = models.Character(id=new_user.id, bonuses=5.0, spent=0.0)
    db.add(new_char)
    
    await db.commit()
    await db.refresh(new_user)
    
    # Mock token
    token = f"mock-token-{new_user.id}"
    return schemas.AuthResponse(token=token, user=new_user)

@router.post("/login", response_model=schemas.AuthResponse)
async def login(request: schemas.LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.User).where(models.User.username == request.username))
    user = result.scalars().first()
    
    if not user:
         raise HTTPException(status_code=404, detail="user not found")
    
    # Check password if provided and user has a hash
    if request.password and user.hashed_password:
        if not verify_password(request.password, user.hashed_password):
            raise HTTPException(status_code=404, detail="user not found")
    elif user.hashed_password and not request.password:
        # User has a password but none provided
        raise HTTPException(status_code=404, detail="user not found")

    if request.api_key:
        user.api_key = request.api_key
        await db.commit()
        await db.refresh(user)
    
    token = f"mock-token-{user.id}"
    return schemas.AuthResponse(token=token, user=user)

@router.get("/me", response_model=schemas.User)
async def get_me(user: models.User = Depends(get_current_user)): 
    return user

@router.put("/me", response_model=schemas.User)
async def update_me(request: schemas.UserUpdate, db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    # update_me uses header before, now dependency handles it.
    if request.api_key is not None:
        user.api_key = request.api_key
        
    await db.commit()
    await db.refresh(user)
    return user
@router.get("/users", response_model=List[schemas.User])
async def list_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.User))
    users = result.scalars().all()
    return users
