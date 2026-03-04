import uuid
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import edges as crud
from app.crud import nodes as node_crud
from app.database import get_db
from app.schemas.edge import EdgeCreate, EdgeResponse, EdgeUpdate, EdgeWithNamesResponse

router = APIRouter()


@router.get(
    "/nodes/{node_id}/edges",
    response_model=list[EdgeWithNamesResponse],
)
async def list_edges_for_node(
    campaign_id: uuid.UUID,
    node_id: uuid.UUID,
    direction: Literal["both", "outgoing", "incoming"] = "both",
    type: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    node = await node_crud.get_node(db, node_id)
    if not node or node.campaign_id != campaign_id:
        raise HTTPException(status_code=404, detail="Node not found")
    return await crud.list_edges_for_node(db, node_id, direction=direction, type=type)


@router.post("/edges", response_model=EdgeResponse, status_code=201)
async def create_edge(
    campaign_id: uuid.UUID,
    data: EdgeCreate,
    db: AsyncSession = Depends(get_db),
):
    # Validate both nodes exist and belong to this campaign
    source = await node_crud.get_node(db, data.source_node_id)
    if not source or source.campaign_id != campaign_id:
        raise HTTPException(status_code=404, detail="Source node not found in this campaign")
    target = await node_crud.get_node(db, data.target_node_id)
    if not target or target.campaign_id != campaign_id:
        raise HTTPException(status_code=404, detail="Target node not found in this campaign")
    return await crud.create_edge(db, data)


@router.patch("/edges/{edge_id}", response_model=EdgeResponse)
async def update_edge(
    campaign_id: uuid.UUID,
    edge_id: uuid.UUID,
    data: EdgeUpdate,
    db: AsyncSession = Depends(get_db),
):
    edge = await crud.get_edge(db, edge_id)
    if not edge:
        raise HTTPException(status_code=404, detail="Edge not found")
    # Verify the edge belongs to this campaign via its source node
    source = await node_crud.get_node(db, edge.source_node_id)
    if not source or source.campaign_id != campaign_id:
        raise HTTPException(status_code=404, detail="Edge not found in this campaign")
    return await crud.update_edge(db, edge, data)


@router.delete("/edges/{edge_id}", status_code=204)
async def delete_edge(
    campaign_id: uuid.UUID,
    edge_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    edge = await crud.get_edge(db, edge_id)
    if not edge:
        raise HTTPException(status_code=404, detail="Edge not found")
    source = await node_crud.get_node(db, edge.source_node_id)
    if not source or source.campaign_id != campaign_id:
        raise HTTPException(status_code=404, detail="Edge not found in this campaign")
    await crud.delete_edge(db, edge)
