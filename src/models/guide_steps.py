from sqlalchemy import ForeignKey, SmallInteger, Text
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base

class GuideStepModel(Base):
    __tablename__ = 'guides_steps'

    guide_id: Mapped[int] = mapped_column(
        ForeignKey('guides.guide_id', ondelete='CASCADE', onupdate='CASCADE'),
        primary_key=True
    )
    step: Mapped[int] = mapped_column(SmallInteger, primary_key=True)
    url: Mapped[str | None] = mapped_column(Text)
    photo: Mapped[str | None] = mapped_column(Text)