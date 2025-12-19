from fastapi import Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app import models

async def get_current_user(authorization: str = Header(None), db: AsyncSession = Depends(get_db)) -> models.User:
    if not authorization:
        # Fallback for dev ease/mock, or strict?
        # Given "mock-token-default" logic in auth.py, we should support it or fail.
        # Let's be stricter now, or support "default" if explicit in token.
        # If no header, fail.
        raise HTTPException(status_code=401, detail="Missing Authentication Token")

    token = authorization.replace("Bearer ", "")
    user_id = token.replace("mock-token-", "")

    if user_id == "default":
        # Return first user or create dummy if empty DB? 
        # Better to just find any user.
        result = await db.execute(select(models.User))
        user = result.scalars().first()
        if not user:
             raise HTTPException(status_code=401, detail="No default user found. Register first.")
        return user

    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid Authentication Token")
        
    return user
