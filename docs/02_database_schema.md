# Database Schema & Graph Design

This document outlines the initial database schema design for the Graph-Based Campaign Engine, focusing on how to represent the "World Brain" relationally inside PostgreSQL.

## 1. Node Types

The core of the system is the **Node**. Everything is a node.

**Current Node Types:**
- `NPC`
- `Location`
- `Organization` (or `Faction`)
- `PC` (Player Character)
- `Event`
- `Session`
- `Item`

**Potentially Missing Node Types:**
- **Quest / Plot Hook:** Useful for tracking objectives and which NPCs/Locations are involved in them.
- **Lore / Concept:** Abstract things like Historical Events, Religions, Magic Systems, or Rumors that don't fit neatly into the other categories.
- **Scene / Encounter:** A sub-unit of a Session. You might prep 3 scenes for a session.
- **Secret and clues:** Secrets are things that the players don't know, but the GM knows. Clues are things that the players can discover to learn secrets.

## 2. Core Architectural Questions & Answers

### Q1: Single Node table vs. Separate tables per type?
**Recommendation: Single `nodes` table with a `type` field and a `JSONB` properties column.**
*   **Why:** In a graph, you often want to traverse connections regardless of what they are (e.g., "Show me everything connected to this Location"). If you have separate tables for `npcs` and `items`, graph traversal in SQL requires complex `UNION` queries. 
*   **Structure:** A single `nodes` table holds the baseline data every node needs (ID, Name, Type, Description, Vector Embedding). Specific data (like an NPC's character sheet or a Location's population) lives in a `properties` JSONB column.

### Q2: Static vs. Dynamic Relations / Edges?
**Recommendation: Dynamic / User-Determined Edges.**
*   **Why:** Hardcoding every possible RPG relationship (is_father_of, is_king_of, located_in) is impossible. 
*   **Structure:** Have a single `edges` table. Each edge has a `source_node_id`, a `target_node_id`, and a `type` (or `label`) string. The `type` can be user-defined (e.g., "Allies", "Rivals", "Nested In"). We can provide a standard set of default edge types, but the user (and the AI) should be able to create new ones on the fly.

### Q3: Should edges be directional?
**Recommendation: Yes, at the database level.**
*   **Why:** Relationships are often one-way or asymmetric. "NPC A is a *member of* Faction B" is not the same in reverse. Faction B is not a member of NPC A. 
*   **UI Implication:** For bidirectional relationships (like "Ally"), the UI can display them as a mutual connection, or the system can automatically create the inverse edge ("Ally" -> "Ally"). In the DB, always store Source -> Target.

### Q4: Connecting Sessions to the Graph & Auto-Linking?
**Recommendation: Sessions are Context Nodes, Notes are Edges/Mentions.**
*   **The Problem:** If PCs meet Thalduin at Spiret, linking Thalduin directly to Spiret just because they were in the same session might create a messy, overly entangled graph. What if they met Thalduin, and later in the session traveled to Spiret? They aren't related.
*   **The Solution:** 
    1. A `Session` is a Node.
    2. When a GM writes a quick note: "PCs meet Thalduin at Spiret".
    3. The AI extracts the entities. It creates an edge between the `Session` and `Thalduin` ("Mentions"), and the `Session` and `Spiret` ("Mentions").
    4. **Smart Linking:** We can instruct the AI to detect *actual* relationships in the notes. If the note says "Thalduin reveals he now rules Spiret", the AI can prompt the user: *"I detected a new relationship: [Thalduin] -> [Rules] -> [Spiret]. Add to graph?"* This keeps the graph clean and intentional.

## 3. Initial PostgreSQL Schema (Draft)

```sql
-- Enables vector embeddings for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL,          -- future-proofing for multi-campaign
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'NPC', 'Location', 'Session', etc.
    description TEXT,
    properties JSONB DEFAULT '{}', -- Flexible schema for specific stats/details
    tags TEXT[] DEFAULT '{}', -- GIN-indexed array for fast filtering ("undead", "political")
    -- Note: 768 is common for Gemini (e.g., text-embedding-004). 
    -- We can keep this configurable via environment variables or migration if we change models later.
    embedding vector(768), 
    is_archived BOOLEAN DEFAULT FALSE, -- Soft delete flag
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_node_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
    target_node_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- Dynamic user-defined label: e.g., 'rules_over', 'located_in'
    properties JSONB DEFAULT '{}', -- E.g., { "confidence": 0.9, "source": "Session 4" }
    weight SMALLINT DEFAULT 1, -- Edge strength for graph visualization and AI context
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_node_id, target_node_id, type)
);

-- Indexes for performance
CREATE INDEX idx_nodes_campaign ON nodes(campaign_id);
CREATE INDEX idx_nodes_type ON nodes(type);
CREATE INDEX idx_nodes_properties ON nodes USING GIN (properties);
CREATE INDEX idx_nodes_tags ON nodes USING GIN (tags);
CREATE INDEX idx_edges_source ON edges(source_node_id);
CREATE INDEX idx_edges_target ON edges(target_node_id);
-- HNSW Index for fast vector similarity search
CREATE INDEX idx_nodes_embedding ON nodes USING hnsw (embedding vector_l2_ops);
```
