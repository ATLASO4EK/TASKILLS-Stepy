from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError

from src.models.users import UserModel
from src.models.guide_steps import GuideStepModel
from src.models.guide_steps_complete import GuideStepCompleteModel
from src.api.dependencies import SessionDep
from src.api.auth import get_current_user
from src.api.guide_steps import get_guide_or_404, get_step_or_404

router = APIRouter()


async def find_completion(guide_id: int, user_id: int, step: int, session):
    result = await session.execute(
        select(GuideStepCompleteModel).where(
            GuideStepCompleteModel.guide_id == guide_id,
            GuideStepCompleteModel.user_id == user_id,
            GuideStepCompleteModel.step == step
        )
    )
    return result.scalar_one_or_none()


@router.post("/guides/{guide_id}/steps/{step}/complete")
async def complete_step(
    guide_id: int,
    step: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
):
    # Нельзя отметить шаг, которого нет в гайде.
    await get_step_or_404(guide_id, step, session)

    if await find_completion(guide_id, current_user.id, step, session):
        raise HTTPException(
            status_code=400,
            detail="Step is already completed"
        )

    # completion всегда True, клиент на это повлиять не может.
    record = GuideStepCompleteModel(
        guide_id=guide_id,
        user_id=current_user.id,
        step=step,
        completion=True
    )

    try:
        session.add(record)
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=400,
            detail="Step is already completed"
        )

    return {"status": "ok"}


@router.delete("/guides/{guide_id}/steps/{step}/complete")
async def uncomplete_step(
    guide_id: int,
    step: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
):
    record = await find_completion(guide_id, current_user.id, step, session)

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Completion record not found"
        )

    await session.delete(record)
    await session.commit()

    return {"status": "ok"}

@router.get("/guides/{guide_id}/progress")
async def get_progress(
    guide_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
):
    await get_guide_or_404(guide_id, session)

    # Номера шагов, которые текущий пользователь отметил выполненными.
    completed_result = await session.execute(
        select(GuideStepCompleteModel.step).where(
            GuideStepCompleteModel.guide_id == guide_id,
            GuideStepCompleteModel.user_id == current_user.id
        ).order_by(GuideStepCompleteModel.step)
    )
    completed_steps = completed_result.scalars().all()

    # Общее число шагов в гайде.
    total_result = await session.execute(
        select(func.count()).select_from(GuideStepModel).where(
            GuideStepModel.guide_id == guide_id
        )
    )
    total_steps = total_result.scalar_one()

    return {
        "guide_id": guide_id,
        "completed_steps": completed_steps,
        "completed_count": len(completed_steps),
        "total_steps": total_steps
    }