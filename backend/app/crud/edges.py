import uuid

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.edge import Edge
from app.models.node import Node
from app.schemas.edge import EdgeCreate, EdgeUpdate


async def list_edges_for_node(
    db: AsyncSession,
    node_id: uuid.UUID,
    *,
    direction: str = "both",
    type: str | None = None,
) -> list[dict]:
    """Return edges for a node with source/target node names included."""
    source = Node.__table__.alias("source")
    target = Node.__table__.alias("target")

    q = (
        select(
            Edge,
            source.c.name.label("source_node_name"),
            target.c.name.label("target_node_name"),
        )
        .join(source, Edge.source_node_id == source.c.id)
        .join(target, Edge.target_node_id == target.c.id)
    )

    if direction == "outgoing":
        q = q.where(Edge.source_node_id == node_id)
    elif direction == "incoming":
        q = q.where(Edge.target_node_id == node_id)
    else:
        q = q.where(or_(Edge.source_node_id == node_id, Edge.target_node_id == node_id))

    if type:
        q = q.where(Edge.type == type)

    result = await db.execute(q)
    rows = result.all()
    return [
        {
            "id": row.Edge.id,
            "source_node_id": row.Edge.source_node_id,
            "target_node_id": row.Edge.target_node_id,
            "source_node_name": row.source_node_name,
            "target_node_name": row.target_node_name,
            "type": row.Edge.type,
            "weight": row.Edge.weight,
            "properties": row.Edge.properties,
        }
        for row in rows
    ]


async def get_edge(db: AsyncSession, edge_id: uuid.UUID) -> Edge | None:
    return await db.get(Edge, edge_id)


async def create_edge(db: AsyncSession, data: EdgeCreate) -> Edge:
    edge = Edge(**data.model_dump())
    db.add(edge)
    await db.commit()
    await db.refresh(edge)
    return edge


async def update_edge(db: AsyncSession, edge: Edge, data: EdgeUpdate) -> Edge:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(edge, field, value)
    await db.commit()
    await db.refresh(edge)
    return edge


async def delete_edge(db: AsyncSession, edge: Edge) -> None:
    await db.delete(edge)
    await db.commit()
