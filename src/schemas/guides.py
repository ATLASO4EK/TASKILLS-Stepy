from pydantic import BaseModel, Field

class GuideAddSchema(BaseModel):
    guide_name: str
    description: str
    photo: str

class GuideUpdateSchema(BaseModel):
    guide_id: int
    guide_name: str | None = None
    description: str | None = None
    photo: str | None = None

class GuideListSchema(BaseModel):
    q: str | None = None
    author: int | None = None
    limit: int = Field(default=10, ge=1, le=100)
    offset: int = Field(default=0, ge=0)
    page: int = Field(default=1, ge=1)

class GuideForkSchema(BaseModel):
    guide_name: str | None = None