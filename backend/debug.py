import asyncio
from data.database import create_tables, AsyncSessionLocal
from data.seed import seed_database
async def main():
    await create_tables()
    async with AsyncSessionLocal() as db:
        await seed_database(db)
asyncio.run(main())
