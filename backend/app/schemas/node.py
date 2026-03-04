import uuid
from datetime import datetime

from pydantic import BaseModel


class NodeCreate(BaseModel):
    name: str
    type: str
    description: str | None = None
    properties: dict = {}
    tags: list[str] = []


class NodeUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    description: str | None = None
    properties: dict | None = None
    tags: list[str] | None = None


class NodeResponse(BaseModel):
    id: uuid.UUID
    campaign_id: uuid.UUID
    name: str
    type: str
    description: str | None
    properties: dict
    tags: list[str]
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
