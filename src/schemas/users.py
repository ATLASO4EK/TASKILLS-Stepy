from pydantic import BaseModel, EmailStr

class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str

class UserAddSchema(UserLoginSchema):
    nickname: str
    isadmin: bool

class UserSchema(UserAddSchema):
    id: int