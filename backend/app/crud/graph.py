import uuid

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.edge import Edge
from app.models.node import Node


async def get_full_graph(
    db: AsyncSession,
    campaign_id: uuid.UUID,
    *,
    node_types: list[str] | None = None,
    min_weight: int | None = None,
) -> dict:
    """Return all non-archived nodes and their edges for graph visualization."""
    node_q = select(Node.id, Node.name, Node.type, Node.tags).where(
        Node.campaign_id == campaign_id,
        Node.is_archived == False,  # noqa: E712
    )
    if node_types:
        node_q = node_q.where(Node.type.in_(node_types))

    node_result = await db.execute(node_q)
    nodes = node_result.all()
    node_ids = {n.id for n in nodes}

    if not node_ids:
        return {"nodes": [], "edges": []}

    edge_q = select(
        Edge.id, Edge.source_node_id, Edge.target_node_id, Edge.type, Edge.weight
    ).where(
        Edge.source_node_id.in_(node_ids),
        Edge.target_node_id.in_(node_ids),
    )
    if min_weight is not None:
        edge_q = edge_q.where(Edge.weight >= min_weight)

    edge_result = await db.execute(edge_q)
    edges = edge_result.all()

    return {
        "nodes": [
            {"id": n.id, "name": n.name, "type": n.type, "tags": n.tags}
            for n in nodes
        ],
        "edges": [
            {
                "id": e.id,
                "source_node_id": e.source_node_id,
                "target_node_id": e.target_node_id,
                "type": e.type,
                "weight": e.weight,
            }
            for e in edges
        ],
    }


async def get_subgraph(
    db: AsyncSession,
    node_id: uuid.UUID,
    depth: int = 1,
) -> dict:
    """Return a subgraph around a node using a recursive CTE."""
    cte_query = text("""
        WITH RECURSIVE reachable(id, depth) AS (
            SELECT CAST(:node_id AS uuid), 0
          UNION
            SELECT CASE
                     WHEN e.source_node_id = r.id THEN e.target_node_id
                     ELSE e.source_node_id
                   END,
                   r.depth + 1
            FROM reachable r
            JOIN edges e ON e.source_node_id = r.id OR e.target_node_id = r.id
            WHERE r.depth < :max_depth
        )
        SELECT DISTINCT id FROM reachable
    """)

    result = await db.execute(cte_query, {"node_id": str(node_id), "max_depth": depth})
    reachable_ids = {row[0] for row in result.all()}

    if not reachable_ids:
        return {"nodes": [], "edges": []}

    node_q = select(Node.id, Node.name, Node.type, Node.tags).where(
        Node.id.in_(reachable_ids),
        Node.is_archived == False,  # noqa: E712
    )
    node_result = await db.execute(node_q)
    nodes = node_result.all()
    active_ids = {n.id for n in nodes}

    edge_q = select(
        Edge.id, Edge.source_node_id, Edge.target_node_id, Edge.type, Edge.weight
    ).where(
        Edge.source_node_id.in_(active_ids),
        Edge.target_node_id.in_(active_ids),
    )
    edge_result = await db.execute(edge_q)
    edges = edge_result.all()

    return {
        "nodes": [
            {"id": n.id, "name": n.name, "type": n.type, "tags": n.tags}
            for n in nodes
        ],
        "edges": [
            {
                "id": e.id,
                "source_node_id": e.source_node_id,
                "target_node_id": e.target_node_id,
                "type": e.type,
                "weight": e.weight,
            }
            for e in edges
        ],
    }
