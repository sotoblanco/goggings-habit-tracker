import pytest
import pytest_asyncio
import os
# Must set before importing database components
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test.db"
from sqlalchemy import select
from app.database import Base, engine, AsyncSessionLocal
from app import models, schemas
import uuid

# Fixture for fresh DB
@pytest_asyncio.fixture(scope="function")
async def db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSessionLocal() as session:
        yield session
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()

@pytest.mark.asyncio
async def test_user_crud(db):
    # Create
    user_id = str(uuid.uuid4())
    new_user = models.User(id=user_id, username="test_crud", api_key="123")
    db.add(new_user)
    await db.commit()
    
    # Read
    res = await db.execute(select(models.User).where(models.User.username == "test_crud"))
    user = res.scalars().first()
    assert user is not None
    assert user.id == user_id
    
    # Update
    user.api_key = "456"
    await db.commit()
    res = await db.execute(select(models.User).where(models.User.id == user_id))
    updated_user = res.scalars().first()
    assert updated_user.api_key == "456"

@pytest.mark.asyncio
async def test_task_crud(db):
    # Create
    user_id = str(uuid.uuid4())
    user = models.User(id=user_id, username="task_user")
    db.add(user)
    await db.commit()

    task_id = str(uuid.uuid4())
    task = models.Task(
        id=task_id, 
        user_id=user_id,
        description="Run", 
        difficulty="Medium", 
        date="2023-01-01",
        category="Fitness",
        estimated_time=30.0
    )
    db.add(task)
    await db.commit()
    
    # Read
    res = await db.execute(select(models.Task).where(models.Task.id == task_id))
    fetched = res.scalars().first()
    assert fetched.description == "Run"
    
    # Delete
    await db.delete(fetched)
    await db.commit()
    res = await db.execute(select(models.Task).where(models.Task.id == task_id))
    assert res.scalars().first() is None
