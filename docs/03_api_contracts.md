# API Design & Contracts

This document outlines the initial REST API contracts between the Next.js Frontend and the FastAPI Backend for the Network GM project.

## Core Principles
- All endpoints are nested under a campaign: `/api/v1/campaigns/{campaign_id}/...`
- All requests and responses use JSON (`application/json`).
- Pagination (where applicable) uses `limit` and `offset` query parameters.
- Standard HTTP status codes are used (200 OK, 201 Created, 400 Bad Request, 404 Not Found, 500 Internal Error).
- Graph queries automatically exclude archived nodes and their edges.

## 1. Graph Visualization & Traversal

These endpoints are optimized for rendering the visual map and exploring connections.

### 1.1 `GET /campaigns/{campaign_id}/graph`
**Purpose:** Fetches the foundational data to render a bird's-eye view of the campaign network. Excludes archived nodes and any edges connected to them.

**Query Parameters:**
- `type` (String, optional, comma-separated) - e.g., `?type=NPC,Location`
- `min_weight` (Integer, optional) - filter edges by importance.

**Response (200 OK):**
```json
{
  "nodes": [
    {
      "id": "uuid",
      "name": "Thalduin",
      "type": "NPC",
      "tags": ["arc-1", "mage"]
    }
  ],
  "edges": [
    {
      "id": "uuid",
      "source_node_id": "uuid",
      "target_node_id": "uuid",
      "type": "Allies",
      "weight": 2
    }
  ]
}
```
*Note: `properties` and `description` are omitted from graph responses to keep the payload light.*

### 1.2 `GET /campaigns/{campaign_id}/graph/nodes/{id}/subgraph`
**Purpose:** Fetches a specific node and all its immediate connections up to a specific depth. Used for generating AI context windows and focusing the user view.

**Query Parameters:**
- `depth` (Integer, default 1, max 3) - How many hops out to query.

**Response (200 OK):**
Returns the same shape as the graph endpoint but localized around the target node.

## 2. Node CRUD

Standard operations for creating, reading, updating, and archiving nodes.

### 2.1 `GET /campaigns/{campaign_id}/nodes`
**Purpose:** Table/List view of nodes. Supports filtering and pagination.

**Query Parameters:**
- `type` (optional) - filter by node type.
- `tags` (optional, comma-separated) - filter by tags.
- `search` (optional) - basic `ILIKE` text search on name/description. For natural language queries, use the semantic search endpoint instead.
- `is_archived` (optional, default `false`) - include archived nodes.
- `limit` (default 50)
- `offset` (default 0)

### 2.2 `GET /campaigns/{campaign_id}/nodes/{id}`
**Purpose:** Full details for a single node, including its `properties` and `description`. This powers the node detail/editing page.

**Response (200 OK):**
```json
{
  "id": "uuid",
  "campaign_id": "uuid",
  "name": "Spiret",
  "type": "Location",
  "description": "A floating city.",
  "properties": {
    "population": 15000,
    "government": "Magocracy",
    "defenses": "Shield dome"
  },
  "tags": ["magic", "capital"],
  "is_archived": false,
  "created_at": "...",
  "updated_at": "..."
}
```

### 2.3 `POST /campaigns/{campaign_id}/nodes`
**Purpose:** Create a new node. Backend generates the vector embedding asynchronously from the name + description.

**Request Body:**
```json
{
  "name": "New Faction",
  "type": "Organization",
  "description": "A secretive guild.",
  "properties": {},
  "tags": ["guild"]
}
```

### 2.4 `PATCH /campaigns/{campaign_id}/nodes/{id}`
**Purpose:** Partial update of a node. Only send the fields that changed. If `description` or `name` changes, the backend re-generates the vector embedding.

**Request Body (example — only changed fields):**
```json
{
  "description": "A secretive guild operating out of the Undercity.",
  "tags": ["guild", "criminal"]
}
```

### 2.5 `DELETE /campaigns/{campaign_id}/nodes/{id}`
**Purpose:** Soft delete. Sets `is_archived=true`. Edges are preserved but hidden from graph queries.

## 3. Edge CRUD

### 3.1 `GET /campaigns/{campaign_id}/nodes/{id}/edges`
**Purpose:** List all edges connected to a specific node (both incoming and outgoing). Used on the node detail page to show its relationships.

**Query Parameters:**
- `direction` (optional: `outgoing`, `incoming`, or `both`, default `both`)
- `type` (optional) - filter by edge type.

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "source_node_id": "uuid",
    "target_node_id": "uuid",
    "source_node_name": "Thalduin",
    "target_node_name": "Spiret",
    "type": "Rules",
    "weight": 2,
    "properties": {}
  }
]
```
*Note: Returns a bare array (not wrapped in an object). Includes `source_node_name` and `target_node_name` so the frontend can display edge lists without additional lookups.*

### 3.2 `POST /campaigns/{campaign_id}/edges`
**Purpose:** Create a new edge between two nodes.

**Request Body:**
```json
{
  "source_node_id": "uuid1",
  "target_node_id": "uuid2",
  "type": "Mentions",
  "weight": 1,
  "properties": {}
}
```

### 3.3 `PATCH /campaigns/{campaign_id}/edges/{id}`
**Purpose:** Update an edge's type, weight, or properties.

**Request Body (example):**
```json
{
  "type": "Allies",
  "weight": 3
}
```

### 3.4 `DELETE /campaigns/{campaign_id}/edges/{id}`
**Purpose:** Hard delete an edge. Edges don't need soft delete — they can be recreated easily.

## 4. Tags

### 4.1 `GET /campaigns/{campaign_id}/tags`
**Purpose:** List all unique tags in use across the campaign. Powers tag autocomplete in the UI.

**Response (200 OK):**
```json
{
  "tags": ["arc-1", "capital", "criminal", "guild", "mage", "magic"]
}
```

## 5. The "Lazy DM" AI Endpoints

Endpoints where the backend delegates work to the LLM.

### 5.1 `POST /campaigns/{campaign_id}/ai/extract-entities`
**Purpose:** The core rapid-logging endpoint. The GM types a raw session note, and the AI suggests graph updates.

**Request Body:**
```json
{
  "session_id": "uuid",
  "text": "The party met with Silas at the Broken Anvil. He revealed that the Cult of the Wyrm is funding the local bandits."
}
```

**Response (200 OK):**
The backend returns *proposed* actions. It does not commit them to the database yet. The frontend renders these for the GM to approve/reject.

```json
{
  "proposal_id": "uuid",
  "proposed_nodes": [
    {
      "temp_id": "temp_1",
      "name": "Silas",
      "type": "NPC",
      "confidence": 0.95,
      "match": { "node_id": "existing_uuid", "name": "Silas" }
    },
    {
      "temp_id": "temp_2",
      "name": "Cult of the Wyrm",
      "type": "Organization",
      "confidence": 0.88,
      "match": null
    }
  ],
  "proposed_edges": [
    {
      "source_ref": "temp_2",
      "target_ref": "temp_3",
      "type": "Funds",
      "confidence": 0.92
    }
  ]
}
```

### 5.2 `POST /campaigns/{campaign_id}/ai/approve`
**Purpose:** Commit approved AI proposals to the graph. The frontend sends back the proposal with the GM's accept/reject decisions per item.

**Request Body:**
```json
{
  "proposal_id": "uuid",
  "approved_nodes": ["temp_1", "temp_2"],
  "approved_edges": [0],
  "rejected_nodes": [],
  "rejected_edges": []
}
```

**Response (201 Created):**
Returns the created nodes and edges with their real IDs.

### 5.3 `GET /campaigns/{campaign_id}/search/semantic`
**Purpose:** Global vector search across all nodes. "Show me things related to dark magic and ancient ruins." For exact name matching, use the `search` param on the nodes list endpoint instead.

**Query Parameters:**
- `query` (string, required) - The natural language query.
- `type` (optional) - restrict search to specific node types.
- `limit` (default 10)

**Response (200 OK):**
Returns a list of nodes ranked by vector similarity score.

```json
{
  "results": [
    {
      "id": "uuid",
      "name": "Tomb of Ashara",
      "type": "Location",
      "description": "An ancient ruin pulsing with dark energy...",
      "tags": ["ruins", "undead"],
      "similarity": 0.87
    }
  ]
}
```
