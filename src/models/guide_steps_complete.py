from sqlalchemy import CheckConstraint, ForeignKey, SmallInteger, text
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base

class GuideStepCompleteModel(Base):
    __tablename__ = 'guide_steps_complete'
    __table_args__ = (
        # В таблице хранятся только выполненные шаги.
        CheckConstraint('completion = true', name='completion_only_true'),
    )

    guide_id: Mapped[int] = mapped_column(
        ForeignKey('guides.guide_id', ondelete='CASCADE', onupdate='CASCADE'),
        primary_key=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey('users.id', ondelete='CASCADE', onupdate='CASCADE'),
        primary_key=True
    )
    step: Mapped[int] = mapped_column(SmallInteger, primary_key=True)
    completion: Mapped[bool] = mapped_column(server_default=text('false'))