from fastapi import APIRouter

from .setup_database import router as setup_database_router
from .users import router as users_router
from .guides import router as guides_router

main_router = APIRouter()
main_router.include_router(setup_database_router)
main_router.include_router(users_router)
main_router.include_router(guides_router)