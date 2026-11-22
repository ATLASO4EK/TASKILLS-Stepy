from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from src.schemas.users import UserAddSchema, UserLoginSchema
from src.models.users import UserModel
from src.api.dependencies import SessionDep
from src.api.auth import create_access_token, get_current_user

router = APIRouter()

def caesar_cipher(text: str, shift: int = 333, decode: bool = False) -> str:
    if decode:
        shift = -shift

    result = []
    for char in text:
        if "а" <= char <= "я":
            base = ord("а")
            result.append(chr((ord(char) - base + shift) % 32 + base))
        elif "А" <= char <= "Я":
            base = ord("А")
            result.append(chr((ord(char) - base + shift) % 32 + base))
        elif "a" <= char <= "z":
            base = ord("a")
            result.append(chr((ord(char) - base + shift) % 26 + base))
        elif "A" <= char <= "Z":
            base = ord("A")
            result.append(chr((ord(char) - base + shift) % 26 + base))
        else:
            result.append(char)

    return "".join(result)


async def get_user(email: str, session: SessionDep):
    stmt = select(UserModel).where(UserModel.email == email)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()

@router.post('/register')
async def register_user(session: SessionDep, data: UserAddSchema):

    new_user = UserModel(
        email=data.email,
        nickname=data.nickname,
        password=caesar_cipher(data.password),
        isadmin=False
    )

    try:
        session.add(new_user)
        await session.commit()

        # После сохранения получаем ID нового пользователя.
        await session.refresh(new_user)

    except IntegrityError:
        # Если email уже занят, отменяем транзакцию.
        await session.rollback()
        raise HTTPException(
            status_code=400,
            detail="User already exists"
        )

    # Сразу выдаём токен, чтобы после регистрации пользователь
    # мог обращаться к защищённым эндпоинтам.
    token = create_access_token(new_user.id)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "nickname": new_user.nickname,
            "isadmin": new_user.isadmin
        }
    }


# Авторизация пользователя.
@router.post('/login')
async def login(session: SessionDep, data: UserLoginSchema):

    user = await get_user(data.email, session)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Проверяем введённый пароль.
    if user.password != caesar_cipher(data.password):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Создаём JWT-токен с ID пользователя.
    token = create_access_token(user.id)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "nickname": user.nickname,
            "isadmin": user.isadmin
        }
    }


# Удаление пользователя.
@router.delete('/delete_user/{user_id}')
async def delete_user(
    user_id: int,
    session: SessionDep,
    current_user: UserModel = Depends(get_current_user)
):

    # Находим пользователя, которого собираемся удалить.
    stmt = select(UserModel).where(UserModel.id == user_id)
    result = await session.execute(stmt)
    del_user = result.scalar_one_or_none()

    if not del_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Удалять пользователя может только он сам или администратор.
    if current_user.id != del_user.id and not current_user.isadmin:
        raise HTTPException(
            status_code=403,
            detail="You cannot delete this user"
        )

    await session.delete(del_user)
    await session.commit()

    return {'status': 'ok'}