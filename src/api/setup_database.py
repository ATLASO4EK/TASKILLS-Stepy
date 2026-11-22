from fastapi import APIRouter

from src.database import engine
from src.models.base import Base

router = APIRouter()

@router.post("/setup_database")
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    return {"status": "ok"}