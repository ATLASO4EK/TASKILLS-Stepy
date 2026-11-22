from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from src.schemas.users import UserAddSchema, UserLoginSchema
from src.models.users import UserModel
from src.api.dependencies import SessionDep

router = APIRouter()

def caesar_cipher(text: str, shift: int=333, decode: bool = False) -> str:
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

@router.post('/register')
async def register_user(data: UserAddSchema, session: SessionDep):
    new_user = UserModel(
        email=data.email,
        nickname=data.nickname,
        password=caesar_cipher(data.password),
        isadmin=data.isadmin,
    )
    try:
        session.add(new_user)
        await session.commit()
    except IntegrityError as error:
        raise HTTPException(status_code=400, detail="User already exists")

    return await login(data.email, data.password, session)

async def get_user(email: str, session:SessionDep):
    stmt = select(UserModel).where(UserModel.email == email)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()

@router.get('/login')
async def login(email:str, password:str, session: SessionDep):
    user = await get_user(email, session)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.password != caesar_cipher(password):
        raise HTTPException(status_code=401, detail="invalid password",)

    user = user.__dict__
    _ = user.pop("password", None)
    _ = user.pop("_sa_instance_state", None)

    return user

@router.delete('/delete_user')
async def delete_user(data: UserLoginSchema, session: SessionDep):
    del_user = await get_user(data.email, session)

    if del_user.password != caesar_cipher(data.password):
        raise HTTPException(status_code=401, detail="invalid password",)

    await session.delete(del_user)
    await session.commit()
    return {'status':'ok'}