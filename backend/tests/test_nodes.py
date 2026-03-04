import pytest
from httpx import AsyncClient

from tests.conftest import CAMPAIGN_ID, OTHER_CAMPAIGN_ID

pytestmark = pytest.mark.asyncio


async def test_create_node(client: AsyncClient):
    resp = await client.post(
        f"/api/v1/campaigns/{CAMPAIGN_ID}/nodes",
        json={"name": "Thalduin", "type": "NPC", "tags": ["mage"]},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Thalduin"
    assert data["campaign_id"] == CAMPAIGN_ID
    assert data["tags"] == ["mage"]
    assert data["is_archived"] is False


async def test_create_node_campaign_scoping(client: AsyncClient):
    """A node created in campaign A is not visible from campaign B."""
    await client.post(
        f"/api/v1/campaigns/{CAMPAIGN_ID}/nodes",
        json={"name": "Thalduin", "type": "NPC"},
    )
    resp = await client.get(f"/api/v1/campaigns/{OTHER_CAMPAIGN_ID}/nodes")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_get_node_wrong_campaign_returns_404(client: AsyncClient):
    """Fetching a node by ID from the wrong campaign returns 404."""
    create = await client.post(
        f"/api/v1/campaigns/{CAMPAIGN_ID}/nodes",
        json={"name": "Thalduin", "type": "NPC"},
    )
    node_id = create.json()["id"]

    resp = await client.get(f"/api/v1/campaigns/{OTHER_CAMPAIGN_ID}/nodes/{node_id}")
    assert resp.status_code == 404


async def test_patch_node_partial_update(client: AsyncClient):
    """PATCH only updates the fields that were sent."""
    create = await client.post(
        f"/api/v1/campaigns/{CAMPAIGN_ID}/nodes",
        json={"name": "Thalduin", "type": "NPC", "tags": ["mage"]},
    )
    node_id = create.json()["id"]

    resp = await client.patch(
        f"/api/v1/campaigns/{CAMPAIGN_ID}/nodes/{node_id}",
        json={"description": "A mysterious mage"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["description"] == "A mysterious mage"
    assert data["name"] == "Thalduin"   # unchanged
    assert data["tags"] == ["mage"]     # unchanged


async def test_patch_node_updated_at_changes(client: AsyncClient):
    """updated_at must be later than created_at after a PATCH."""
    create = await client.post(
        f"/api/v1/campaigns/{CAMPAIGN_ID}/nodes",
        json={"name": "Thalduin", "type": "NPC"},
    )
    node = create.json()

    patch = await client.patch(
        f"/api/v1/campaigns/{CAMPAIGN_ID}/nodes/{node['id']}",
        json={"description": "Updated"},
    )
    updated = patch.json()
    assert updated["updated_at"] > node["updated_at"]


async def test_archive_node(client: AsyncClient):
    """DELETE sets is_archived=True, node disappears from default list."""
    create = await client.post(
        f"/api/v1/campaigns/{CAMPAIGN_ID}/nodes",
        json={"name": "Thalduin", "type": "NPC"},
    )
    node_id = create.json()["id"]

    resp = await client.delete(f"/api/v1/campaigns/{CAMPAIGN_ID}/nodes/{node_id}")
    assert resp.status_code == 200
    assert resp.json()["is_archived"] is True

    list_resp = await client.get(f"/api/v1/campaigns/{CAMPAIGN_ID}/nodes")
    ids = [n["id"] for n in list_resp.json()]
    assert node_id not in ids


async def test_archived_node_visible_with_flag(client: AsyncClient):
    """Archived nodes appear when is_archived=true is passed."""
    create = await client.post(
        f"/api/v1/campaigns/{CAMPAIGN_ID}/nodes",
        json={"name": "Thalduin", "type": "NPC"},
    )
    node_id = create.json()["id"]
    await client.delete(f"/api/v1/campaigns/{CAMPAIGN_ID}/nodes/{node_id}")

    resp = await client.get(
        f"/api/v1/campaigns/{CAMPAIGN_ID}/nodes?is_archived=true"
    )
    ids = [n["id"] for n in resp.json()]
    assert node_id in ids


async def test_list_nodes_filter_by_type(client: AsyncClient):
    await client.post(
        f"/api/v1/campaigns/{CAMPAIGN_ID}/nodes",
        json={"name": "Thalduin", "type": "NPC"},
    )
    await client.post(
        f"/api/v1/campaigns/{CAMPAIGN_ID}/nodes",
        json={"name": "Spiret", "type": "Location"},
    )

    resp = await client.get(f"/api/v1/campaigns/{CAMPAIGN_ID}/nodes?type=NPC")
    assert all(n["type"] == "NPC" for n in resp.json())
