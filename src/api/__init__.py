from fastapi import APIRouter

from .setup_database import router as setup_database_router
from .users import router as users_router
from .guides import router as guides_router
from .guide_steps import router as guide_steps_router
from .guide_steps_complete import router as guide_steps_complete_router

main_router = APIRouter()
main_router.include_router(setup_database_router)
main_router.include_router(users_router)
main_router.include_router(guides_router)
main_router.include_router(guide_steps_router)
main_router.include_router(guide_steps_complete_router)