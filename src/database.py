import os

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

load_dotenv('src/.env')

DATABASE_CONN_STRING = os.getenv('DATABASE_CONN_STRING')

engine = create_async_engine(DATABASE_CONN_STRING)

new_session = async_sessionmaker(bind=engine, expire_on_commit=False)

async def get_session():
    async with new_session() as session:
        yield session