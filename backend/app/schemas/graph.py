import uuid

from pydantic import BaseModel


class GraphNode(BaseModel):
    id: uuid.UUID
    name: str
    type: str
    tags: list[str]

    model_config = {"from_attributes": True}


class GraphEdge(BaseModel):
    id: uuid.UUID
    source_node_id: uuid.UUID
    target_node_id: uuid.UUID
    type: str
    weight: int

    model_config = {"from_attributes": True}


class GraphResponse(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]
