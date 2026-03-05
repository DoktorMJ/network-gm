# Project Vision: Graph-Based Campaign Engine

## Core Concept
A hosted, AI-augmented "World Brain" for a group of Tabletop RPG Game Masters. It treats campaigns as a living network of nodes (NPCs, Locations, Events) rather than static text files. Multiple GMs share and collaborate on the same campaign graph. 

## Feature Tracker

### 1. The Relational Knowledge Graph
- [Built] **Node-Based Architecture:** Full CRUD API for nodes and edges, campaign scoping, soft delete, tag filtering, text search, graph + subgraph endpoints. 21 automated tests.
- [Built] **Browser CRUD UI (Slice 1):** Full node and relationship management from the browser — create, edit, archive nodes; add/remove typed edges with weight; parchment-themed sidebar with dynamic type navigation (types fetched from live data), tag autocomplete, key-value properties editor, loading skeletons, error states.
- [Concept] **Visual Map:** Interactive node-map for factions and characters.
- [Built] **Standard Navigation:** Filterable list view with sidebar type navigation, search, and archived toggle.

### 2. Intelligence Layer (AI-Augmented)
- [Concept] **Procedural Content Generation:** Context-aware NPCs, loot, rumors.
- [Concept] **The "Lazy DM" Prep Module:** AI-assisted 8-step prep workflow.
- [Concept] **Context-Aware Advice:** "GM Move" generator based on scene context.

### 3. The Living History (Play Log)
- [Concept] **Streamlined Logging:** Rapid entry interface for session notes.
- [Concept] **Entity Extraction:** Auto-detect and link/create new entities from logs.
- [Concept] **Timeline Reconstruction:** Chronological view of events and reveals.

### 4. Immersion & Polish
- [Concept] **Atmospheric Automation:** Audio/visual triggers tied to nodes.
- [Built] **Text Search:** Basic `ILIKE` search on node name and description via `?search=` query param.
- [Concept] **Semantic Search:** Vector similarity search via pgvector (embedding column exists, generation not yet wired).
- [Concept] **Global Spotlight:** Millisecond cross-type "Spotlight" style search.