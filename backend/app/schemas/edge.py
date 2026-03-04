import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class EdgeCreate(BaseModel):
    source_node_id: uuid.UUID
    target_node_id: uuid.UUID
    type: str
    weight: int = 1
    properties: dict = Field(default_factory=dict)


class EdgeUpdate(BaseModel):
    type: str | None = None
    weight: int | None = None
    properties: dict | None = None


class EdgeResponse(BaseModel):
    id: uuid.UUID
    source_node_id: uuid.UUID
    target_node_id: uuid.UUID
    type: str
    weight: int
    properties: dict
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EdgeWithNamesResponse(BaseModel):
    id: uuid.UUID
    source_node_id: uuid.UUID
    target_node_id: uuid.UUID
    source_node_name: str
    target_node_name: str
    type: str
    weight: int
    properties: dict

    model_config = {"from_attributes": True}
