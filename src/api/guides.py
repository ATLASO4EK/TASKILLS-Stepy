from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import select, or_
from sqlalchemy.exc import IntegrityError

from src.schemas.guides import GuideAddSchema, GuideListSchema, GuideUpdateSchema
from src.models.users import UserModel
from src.models.guides import GuideModel
from src.api.dependencies import SessionDep
from src.api.auth import get_current_user
from src.schemas.guides import GuideForkSchema
from src.models.guide_steps import GuideStepModel
from src.api.guide_steps import get_guide_or_404

router = APIRouter()

@router.get("/guides")
async def get_guides(
    data: GuideListSchema = Depends(),
    session: SessionDep = None
):
    stmt = select(GuideModel)

    # Поиск по названию и описанию
    if data.q:
        stmt = stmt.where(
            or_(
                GuideModel.guide_name.ilike(f"%{data.q}%"),
                GuideModel.description.ilike(f"%{data.q}%")
            )
        )

    # Фильтрация по автору
    if data.author is not None:
        stmt = stmt.where(
            GuideModel.author == data.author
        )

    # Пагинация
    offset = (data.page - 1) * data.limit + data.offset

    stmt = stmt.order_by(
        GuideModel.guide_id
    ).limit(data.limit).offset(offset)

    result = await session.execute(stmt)
    guides = result.scalars().all()

    if not guides:
        raise HTTPException(
            status_code=404,
            detail="Guides not found"
        )

    return [
        {
            "guide_id": guide.guide_id,
            "author": guide.author,
            "guide_name": guide.guide_name,
            "description": guide.description,
            "photo": guide.photo
        }
        for guide in guides
    ]

@router.post("/guides")
async def create_guide(
    data: GuideAddSchema,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
):
    new_guide = GuideModel(
        author=current_user.id,
        guide_name=data.guide_name,
        description=data.description,
        photo=data.photo
    )
    try:
        session.add(new_guide)
        await session.commit()
        await session.refresh(new_guide)

        return {
            "status": "ok",
            "guide_id": new_guide.guide_id
        }
    except IntegrityError:
        # Если email уже занят, отменяем транзакцию.
        await session.rollback()
        raise HTTPException(
            status_code=400,
            detail="Guide with this name already exists"
        )

@router.patch("/guides")
async def update_guide(
    data: GuideUpdateSchema,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
):
    stmt = select(GuideModel).where(
        GuideModel.guide_id == data.guide_id
    )

    result = await session.execute(stmt)
    guide = result.scalar_one_or_none()

    if not guide:
        raise HTTPException(
            status_code=404,
            detail="Guide not found"
        )

    # Проверяем владельца
    if guide.author != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not the author of this guide"
        )

    update_data = data.model_dump(
        exclude_unset=True,
        exclude={"guide_id"}
    )

    for key, value in update_data.items():
        setattr(guide, key, value)

    await session.commit()

    return {
        "status": "ok",
        "guide_id": guide.guide_id
    }

@router.delete("/guides/{guide_id}")
async def delete_guide(
    guide_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
):
    stmt = select(GuideModel).where(
        GuideModel.guide_id == guide_id
    )

    result = await session.execute(stmt)
    guide = result.scalar_one_or_none()

    if not guide:
        raise HTTPException(
            status_code=404,
            detail="Guide not found"
        )

    if guide.author != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not the author of this guide"
        )

    await session.delete(guide)
    await session.commit()

    return {"status": "ok"}

@router.post("/guides/{guide_id}/fork")
async def fork_guide(
    guide_id: int,
    session: SessionDep,
    data: GuideForkSchema | None = None,
    current_user: UserModel = Depends(get_current_user)
):
    original = await get_guide_or_404(guide_id, session)

    # Все шаги оригинала.
    result = await session.execute(
        select(GuideStepModel).where(
            GuideStepModel.guide_id == guide_id
        ).order_by(GuideStepModel.step)
    )
    steps = result.scalars().all()

    # guide_name уникален, поэтому копии нужно другое имя.
    new_name = (data.guide_name.strip() if data and data.guide_name else "")
    if not new_name:
        new_name = f"{original.guide_name} (copy)"

    new_guide = GuideModel(
        author=current_user.id,
        guide_name=new_name,
        description=original.description,
        photo=original.photo
    )

    try:
        session.add(new_guide)
        await session.flush()  # получаем guide_id новой записи

        session.add_all([
            GuideStepModel(
                guide_id=new_guide.guide_id,
                step=s.step,
                url=s.url,
                photo=s.photo
            )
            for s in steps
        ])

        # Гайд и шаги сохраняются одной транзакцией.
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=400,
            detail="Guide with this name already exists, pass another guide_name"
        )

    return {
        "status": "ok",
        "guide_id": new_guide.guide_id,
        "forked_from": guide_id,
        "steps_copied": len(steps)
    }