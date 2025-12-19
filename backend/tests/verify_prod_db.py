import asyncio
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

# Explicitly point to goggins.db
DATABASE_URL = "sqlite+aiosqlite:///./goggins.db"

async def verify_prod_tables():
    print(f"Connecting to {DATABASE_URL}...")
    engine = create_async_engine(DATABASE_URL)
    
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT name FROM sqlite_master WHERE type='table';"))
        tables = result.scalars().all()
        print(f"Tables found: {tables}")
        
        if 'users' in tables:
            print("SUCCESS: 'users' table exists.")
        else:
            print("FAILURE: 'users' table MISSING.")
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(verify_prod_tables())
