import pytest
from httpx import AsyncClient

from tests.conftest import CAMPAIGN_ID, OTHER_CAMPAIGN_ID

pytestmark = pytest.mark.asyncio


async def _make_node(client, name, type_="NPC", campaign=CAMPAIGN_ID):
    resp = await client.post(
        f"/api/v1/campaigns/{campaign}/nodes",
        json={"name": name, "type": type_},
    )
    return resp.json()["id"]


async def test_create_edge(client: AsyncClient):
    src = await _make_node(client, "Thalduin")
    tgt = await _make_node(client, "Spiret", "Location")

    resp = await client.post(
        f"/api/v1/campaigns/{CAMPAIGN_ID}/edges",
        json={"source_node_id": src, "target_node_id": tgt, "type": "Rules", "weight": 2},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["type"] == "Rules"
    assert data["weight"] == 2


async def test_create_edge_cross_campaign_returns_404(client: AsyncClient):
    """Cannot link a node from campaign A to a node from campaign B."""
    src = await _make_node(client, "Thalduin", campaign=CAMPAIGN_ID)
    tgt = await _make_node(client, "Spiret", "Location", campaign=OTHER_CAMPAIGN_ID)

    resp = await client.post(
        f"/api/v1/campaigns/{CAMPAIGN_ID}/edges",
        json={"source_node_id": src, "target_node_id": tgt, "type": "Rules"},
    )
    assert resp.status_code == 404


async def test_list_edges_for_node_includes_names(client: AsyncClient):
    """Edge list response includes source_node_name and target_node_name."""
    src = await _make_node(client, "Thalduin")
    tgt = await _make_node(client, "Spiret", "Location")
    await client.post(
        f"/api/v1/campaigns/{CAMPAIGN_ID}/edges",
        json={"source_node_id": src, "target_node_id": tgt, "type": "Rules"},
    )

    resp = await client.get(f"/api/v1/campaigns/{CAMPAIGN_ID}/nodes/{src}/edges")
    assert resp.status_code == 200
    edge = resp.json()[0]
    assert edge["source_node_name"] == "Thalduin"
    assert edge["target_node_name"] == "Spiret"


async def test_list_edges_direction_outgoing(client: AsyncClient):
    src = await _make_node(client, "Thalduin")
    tgt = await _make_node(client, "Spiret", "Location")
    await client.post(
        f"/api/v1/campaigns/{CAMPAIGN_ID}/edges",
        json={"source_node_id": src, "target_node_id": tgt, "type": "Rules"},
    )

    resp = await client.get(
        f"/api/v1/campaigns/{CAMPAIGN_ID}/nodes/{tgt}/edges?direction=outgoing"
    )
    assert resp.json() == []


async def test_list_edges_invalid_direction_returns_422(client: AsyncClient):
    node_id = await _make_node(client, "Thalduin")
    resp = await client.get(
        f"/api/v1/campaigns/{CAMPAIGN_ID}/nodes/{node_id}/edges?direction=sideways"
    )
    assert resp.status_code == 422


async def test_delete_edge(client: AsyncClient):
    src = await _make_node(client, "Thalduin")
    tgt = await _make_node(client, "Spiret", "Location")
    create = await client.post(
        f"/api/v1/campaigns/{CAMPAIGN_ID}/edges",
        json={"source_node_id": src, "target_node_id": tgt, "type": "Rules"},
    )
    edge_id = create.json()["id"]

    resp = await client.delete(f"/api/v1/campaigns/{CAMPAIGN_ID}/edges/{edge_id}")
    assert resp.status_code == 204

    edges = await client.get(f"/api/v1/campaigns/{CAMPAIGN_ID}/nodes/{src}/edges")
    assert edges.json() == []
