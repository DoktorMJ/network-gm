import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import graph as crud
from app.crud import nodes as node_crud
from app.database import get_db
from app.schemas.graph import GraphResponse

router = APIRouter()


@router.get("", response_model=GraphResponse)
async def get_full_graph(
    campaign_id: uuid.UUID,
    type: str | None = None,
    min_weight: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    node_types = [t.strip() for t in type.split(",")] if type else None
    data = await crud.get_full_graph(db, campaign_id, node_types=node_types, min_weight=min_weight)
    return data


@router.get(
    "/nodes/{node_id}/subgraph",
    response_model=GraphResponse,
)
async def get_subgraph(
    campaign_id: uuid.UUID,
    node_id: uuid.UUID,
    depth: int = Query(1, ge=1, le=3),
    db: AsyncSession = Depends(get_db),
):
    node = await node_crud.get_node(db, node_id)
    if not node or node.campaign_id != campaign_id:
        raise HTTPException(status_code=404, detail="Node not found")
    data = await crud.get_subgraph(db, node_id, depth=depth)
    return data
