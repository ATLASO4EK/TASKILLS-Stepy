from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base

class GuideModel(Base):
    __tablename__ = 'users'

    guide_id: Mapped[int] = mapped_column(primary_key=True)