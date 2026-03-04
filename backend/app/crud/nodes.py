import uuid
from datetime import datetime, timezone

from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.node import Node
from app.schemas.node import NodeCreate, NodeUpdate


async def list_nodes(
    db: AsyncSession,
    campaign_id: uuid.UUID,
    *,
    type: str | None = None,
    tags: list[str] | None = None,
    search: str | None = None,
    is_archived: bool = False,
    limit: int = 50,
    offset: int = 0,
) -> list[Node]:
    q = select(Node).where(
        Node.campaign_id == campaign_id,
        Node.is_archived == is_archived,
    )
    if type:
        q = q.where(Node.type == type)
    if tags:
        q = q.where(Node.tags.overlap(tags))
    if search:
        pattern = f"%{search}%"
        q = q.where(Node.name.ilike(pattern) | Node.description.ilike(pattern))
    q = q.order_by(Node.updated_at.desc()).limit(limit).offset(offset)
    result = await db.execute(q)
    return list(result.scalars().all())


async def get_node(db: AsyncSession, node_id: uuid.UUID) -> Node | None:
    return await db.get(Node, node_id)


async def create_node(db: AsyncSession, campaign_id: uuid.UUID, data: NodeCreate) -> Node:
    node = Node(campaign_id=campaign_id, **data.model_dump())
    db.add(node)
    await db.commit()
    await db.refresh(node)
    return node


async def update_node(db: AsyncSession, node: Node, data: NodeUpdate) -> Node:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(node, field, value)
    node.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(node)
    return node


async def archive_node(db: AsyncSession, node: Node) -> Node:
    node.is_archived = True
    await db.commit()
    await db.refresh(node)
    return node


async def get_unique_tags(db: AsyncSession, campaign_id: uuid.UUID) -> list[str]:
    # Use raw SQL: SELECT DISTINCT unnest(tags) AS tag FROM nodes WHERE ... ORDER BY tag
    result = await db.execute(
        text(
            "SELECT DISTINCT unnest(tags) AS tag FROM nodes "
            "WHERE campaign_id = :cid AND is_archived = false "
            "ORDER BY tag"
        ),
        {"cid": str(campaign_id)},
    )
    return [row[0] for row in result.all()]
