from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base

class GuideModel(Base):
    __tablename__ = 'guides'

    guide_id: Mapped[int] = mapped_column(primary_key=True)
    author: Mapped[int] = mapped_column(ForeignKey('users.id'))
    guide_name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    photo: Mapped[str] = mapped_column(String(512))