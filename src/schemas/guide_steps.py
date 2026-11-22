from pydantic import BaseModel, Field

class GuideStepAddSchema(BaseModel):
    step: int = Field(ge=1, le=32767)  # smallint
    url: str | None = None
    photo: str | None = None

class GuideStepUpdateSchema(BaseModel):
    url: str | None = None
    photo: str | None = None