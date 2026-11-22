from pydantic import BaseModel

class UserLoginSchema(BaseModel):
    email: str
    password: str

class UserAddSchema(UserLoginSchema):
    nickname: str
    isadmin: bool

class UserSchema(UserAddSchema):
    id: int