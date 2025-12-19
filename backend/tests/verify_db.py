import asyncio
from sqlalchemy import select
from app.database import engine, AsyncSessionLocal, Base
from app.models import Task, User

async def verify_tables():
    async with AsyncSessionLocal() as session:
        # Check connection
        print("Checking connection...")
        async with engine.begin() as conn:
             # Just verify we can fetch tables
             tables = await conn.run_sync(lambda sync_conn: sync_conn.dialect.get_table_names(sync_conn))
             print(f"Tables found: {tables}")
        
async def main():
    await verify_tables()

if __name__ == "__main__":
    asyncio.run(main())
