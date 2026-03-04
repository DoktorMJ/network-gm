from pydantic import BaseModel


class HealthCheckResponse(BaseModel):
    status: str
    message: str


class TagsResponse(BaseModel):
    tags: list[str]
