import asyncio
import os
from sqlalchemy import text
from app.database import engine, DATABASE_URL

async def verify_prod_tables_exact():
    print(f"Checking Database at: {DATABASE_URL}")
    
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT name FROM sqlite_master WHERE type='table';"))
        tables = result.scalars().all()
        print(f"Tables found: {tables}")
        
        required = {'users', 'tasks', 'goals'}
        if required.issubset(set(tables)):
            print("SUCCESS: Core tables exist.")
        else:
            print(f"FAILURE: Missing tables. Found: {tables}")
            
    await engine.dispose()

if __name__ == "__main__":
    try:
        asyncio.run(verify_prod_tables_exact())
    except Exception as e:
        print(f"Verification Failed: {e}")
