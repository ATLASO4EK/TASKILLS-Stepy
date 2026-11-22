from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base

class UserModel(Base):
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(unique=True)
    nickname: Mapped[str]
    password: Mapped[str]
    isadmin: Mapped[bool]