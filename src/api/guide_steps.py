from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from src.schemas.guide_steps import GuideStepAddSchema, GuideStepUpdateSchema
from src.models.users import UserModel
from src.models.guides import GuideModel
from src.models.guide_steps import GuideStepModel
from src.api.dependencies import SessionDep
from src.api.auth import get_current_user

router = APIRouter()


async def get_guide_or_404(guide_id: int, session) -> GuideModel:
    result = await session.execute(
        select(GuideModel).where(GuideModel.guide_id == guide_id)
    )
    guide = result.scalar_one_or_none()

    if not guide:
        raise HTTPException(status_code=404, detail="Guide not found")

    return guide


async def get_own_guide(guide_id: int, session, current_user: UserModel) -> GuideModel:
    guide = await get_guide_or_404(guide_id, session)

    if guide.author != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not the author of this guide"
        )

    return guide


async def get_step_or_404(guide_id: int, step: int, session) -> GuideStepModel:
    result = await session.execute(
        select(GuideStepModel).where(
            GuideStepModel.guide_id == guide_id,
            GuideStepModel.step == step
        )
    )
    step_row = result.scalar_one_or_none()

    if not step_row:
        raise HTTPException(status_code=404, detail="Step not found")

    return step_row


@router.get("/guides/{guide_id}/steps")
async def get_steps(guide_id: int, session: SessionDep):
    await get_guide_or_404(guide_id, session)

    stmt = select(GuideStepModel).where(
        GuideStepModel.guide_id == guide_id
    ).order_by(GuideStepModel.step)

    result = await session.execute(stmt)
    steps = result.scalars().all()

    return [
        {
            "guide_id": s.guide_id,
            "step": s.step,
            "url": s.url,
            "photo": s.photo
        }
        for s in steps
    ]


@router.post("/guides/{guide_id}/steps")
async def create_step(
    guide_id: int,
    data: GuideStepAddSchema,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
):
    await get_own_guide(guide_id, session, current_user)

    # Шаг с таким номером в этом гайде уже есть?
    exists = await session.execute(
        select(GuideStepModel).where(
            GuideStepModel.guide_id == guide_id,
            GuideStepModel.step == data.step
        )
    )
    if exists.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Step with this number already exists"
        )

    new_step = GuideStepModel(
        guide_id=guide_id,
        step=data.step,
        url=data.url,
        photo=data.photo
    )

    try:
        session.add(new_step)
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=400,
            detail="Step with this number already exists"
        )

    return {"status": "ok", "guide_id": guide_id, "step": data.step}


@router.patch("/guides/{guide_id}/steps/{step}")
async def update_step(
    guide_id: int,
    step: int,
    data: GuideStepUpdateSchema,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
):
    await get_own_guide(guide_id, session, current_user)
    step_row = await get_step_or_404(guide_id, step, session)

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(step_row, key, value)

    await session.commit()

    return {"status": "ok", "guide_id": guide_id, "step": step}


@router.delete("/guides/{guide_id}/steps/{step}")
async def delete_step(
    guide_id: int,
    step: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
):
    await get_own_guide(guide_id, session, current_user)
    step_row = await get_step_or_404(guide_id, step, session)

    await session.delete(step_row)
    await session.commit()

    return {"status": "ok"}