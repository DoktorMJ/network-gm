import pytest
from httpx import AsyncClient

from tests.conftest import CAMPAIGN_ID

pytestmark = pytest.mark.asyncio


async def _make_node(client, name, type_="NPC"):
    resp = await client.post(
        f"/api/v1/campaigns/{CAMPAIGN_ID}/nodes",
        json={"name": name, "type": type_},
    )
    return resp.json()["id"]


async def _make_edge(client, src, tgt, type_="Knows"):
    resp = await client.post(
        f"/api/v1/campaigns/{CAMPAIGN_ID}/edges",
        json={"source_node_id": src, "target_node_id": tgt, "type": type_},
    )
    return resp.json()["id"]


async def test_full_graph_empty_campaign(client: AsyncClient):
    """An empty campaign returns empty nodes and edges lists."""
    resp = await client.get(f"/api/v1/campaigns/{CAMPAIGN_ID}/graph")
    assert resp.status_code == 200
    assert resp.json() == {"nodes": [], "edges": []}


async def test_full_graph_returns_nodes_and_edges(client: AsyncClient):
    src = await _make_node(client, "Thalduin")
    tgt = await _make_node(client, "Spiret", "Location")
    await _make_edge(client, src, tgt, "Rules")

    resp = await client.get(f"/api/v1/campaigns/{CAMPAIGN_ID}/graph")
    data = resp.json()
    assert len(data["nodes"]) == 2
    assert len(data["edges"]) == 1


async def test_full_graph_excludes_archived_nodes(client: AsyncClient):
    """Archived nodes and their edges must not appear in the graph."""
    src = await _make_node(client, "Thalduin")
    tgt = await _make_node(client, "Spiret", "Location")
    await _make_edge(client, src, tgt, "Rules")

    await client.delete(f"/api/v1/campaigns/{CAMPAIGN_ID}/nodes/{tgt}")

    resp = await client.get(f"/api/v1/campaigns/{CAMPAIGN_ID}/graph")
    data = resp.json()
    node_ids = [n["id"] for n in data["nodes"]]
    assert tgt not in node_ids
    assert data["edges"] == []


async def test_full_graph_filter_by_type(client: AsyncClient):
    await _make_node(client, "Thalduin", "NPC")
    await _make_node(client, "Spiret", "Location")

    resp = await client.get(f"/api/v1/campaigns/{CAMPAIGN_ID}/graph?type=NPC")
    data = resp.json()
    assert all(n["type"] == "NPC" for n in data["nodes"])


async def test_subgraph_depth_1(client: AsyncClient):
    """At depth=1, subgraph includes only the node and its direct neighbours."""
    # Chain: A -> B -> C
    a = await _make_node(client, "A")
    b = await _make_node(client, "B")
    c = await _make_node(client, "C")
    await _make_edge(client, a, b)
    await _make_edge(client, b, c)

    resp = await client.get(
        f"/api/v1/campaigns/{CAMPAIGN_ID}/graph/nodes/{a}/subgraph?depth=1"
    )
    node_ids = {n["id"] for n in resp.json()["nodes"]}
    assert a in node_ids
    assert b in node_ids
    assert c not in node_ids  # two hops away — outside depth=1


async def test_subgraph_depth_2(client: AsyncClient):
    """At depth=2, subgraph reaches two hops out."""
    a = await _make_node(client, "A")
    b = await _make_node(client, "B")
    c = await _make_node(client, "C")
    await _make_edge(client, a, b)
    await _make_edge(client, b, c)

    resp = await client.get(
        f"/api/v1/campaigns/{CAMPAIGN_ID}/graph/nodes/{a}/subgraph?depth=2"
    )
    node_ids = {n["id"] for n in resp.json()["nodes"]}
    assert a in node_ids
    assert b in node_ids
    assert c in node_ids


async def test_tags_endpoint(client: AsyncClient):
    await client.post(
        f"/api/v1/campaigns/{CAMPAIGN_ID}/nodes",
        json={"name": "Thalduin", "type": "NPC", "tags": ["mage", "arc-1"]},
    )
    await client.post(
        f"/api/v1/campaigns/{CAMPAIGN_ID}/nodes",
        json={"name": "Spiret", "type": "Location", "tags": ["capital", "arc-1"]},
    )

    resp = await client.get(f"/api/v1/campaigns/{CAMPAIGN_ID}/tags")
    assert resp.status_code == 200
    tags = resp.json()["tags"]
    assert tags == sorted(tags)           # must be sorted
    assert len(tags) == len(set(tags))    # must be unique
    assert "arc-1" in tags
    assert "mage" in tags
    assert "capital" in tags
