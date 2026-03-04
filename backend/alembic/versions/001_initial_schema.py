"""Initial schema — nodes and edges tables

Revision ID: 001
Revises:
Create Date: 2026-02-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        "nodes",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("campaign_id", UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("properties", JSONB, server_default="{}"),
        sa.Column("tags", ARRAY(sa.Text), server_default="{}"),
        sa.Column("embedding", Vector(768), nullable=True),
        sa.Column("is_archived", sa.Boolean, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_index("idx_nodes_campaign", "nodes", ["campaign_id"])
    op.create_index("idx_nodes_type", "nodes", ["type"])
    op.create_index("idx_nodes_properties", "nodes", ["properties"], postgresql_using="gin")
    op.create_index("idx_nodes_tags", "nodes", ["tags"], postgresql_using="gin")

    op.create_table(
        "edges",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("source_node_id", UUID(as_uuid=True), sa.ForeignKey("nodes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("target_node_id", UUID(as_uuid=True), sa.ForeignKey("nodes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("type", sa.String(100), nullable=False),
        sa.Column("properties", JSONB, server_default="{}"),
        sa.Column("weight", sa.SmallInteger, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("source_node_id", "target_node_id", "type", name="uq_edge_source_target_type"),
    )

    op.create_index("idx_edges_source", "edges", ["source_node_id"])
    op.create_index("idx_edges_target", "edges", ["target_node_id"])

    # HNSW index for fast vector similarity search
    op.execute(
        "CREATE INDEX idx_nodes_embedding ON nodes USING hnsw (embedding vector_l2_ops)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_nodes_embedding")
    op.drop_table("edges")
    op.drop_table("nodes")
    op.execute("DROP EXTENSION IF EXISTS vector")
