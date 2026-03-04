import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import nodes as crud
from app.database import get_db
from app.schemas.node import NodeCreate, NodeResponse, NodeUpdate

router = APIRouter()


@router.get("", response_model=list[NodeResponse])
async def list_nodes(
    campaign_id: uuid.UUID,
    type: str | None = None,
    tags: str | None = None,
    search: str | None = None,
    is_archived: bool = False,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    tag_list = [t.strip() for t in tags.split(",")] if tags else None
    return await crud.list_nodes(
        db, campaign_id,
        type=type, tags=tag_list, search=search,
        is_archived=is_archived, limit=limit, offset=offset,
    )


@router.get("/{node_id}", response_model=NodeResponse)
async def get_node(
    campaign_id: uuid.UUID,
    node_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    node = await crud.get_node(db, node_id)
    if not node or node.campaign_id != campaign_id:
        raise HTTPException(status_code=404, detail="Node not found")
    return node


@router.post("", response_model=NodeResponse, status_code=201)
async def create_node(
    campaign_id: uuid.UUID,
    data: NodeCreate,
    db: AsyncSession = Depends(get_db),
):
    return await crud.create_node(db, campaign_id, data)


@router.patch("/{node_id}", response_model=NodeResponse)
async def update_node(
    campaign_id: uuid.UUID,
    node_id: uuid.UUID,
    data: NodeUpdate,
    db: AsyncSession = Depends(get_db),
):
    node = await crud.get_node(db, node_id)
    if not node or node.campaign_id != campaign_id:
        raise HTTPException(status_code=404, detail="Node not found")
    return await crud.update_node(db, node, data)


@router.delete("/{node_id}", response_model=NodeResponse)
async def archive_node(
    campaign_id: uuid.UUID,
    node_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    node = await crud.get_node(db, node_id)
    if not node or node.campaign_id != campaign_id:
        raise HTTPException(status_code=404, detail="Node not found")
    return await crud.archive_node(db, node)
