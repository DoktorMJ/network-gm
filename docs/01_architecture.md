# System Architecture

## Tech Stack
- **Backend:** Python / FastAPI (async — `asyncpg` + async SQLAlchemy)
- **Database:** PostgreSQL with `pgvector` extension
- **Frontend:** Next.js 16 (React 19) / Tailwind CSS v4 / shadcn/ui (canary) / SWR
- **AI/Logic:** Direct LLM API calls (OpenAI / Anthropic) with a thin Python wrapper. LangChain is deferred to a future phase — only to be introduced if AI pipelines become complex enough to warrant the abstraction.

## Deployment Model
- **Hosted web app** on a single VPS (e.g. Railway, Fly.io, or Hetzner).
- **Multi-user:** 4 Game Masters sharing a single campaign. No per-user campaigns or complex tenancy for now.
- **Concurrency model:** Last-write-wins. Real-time collaboration is out of scope for v1.
- **Auth:** Simple authentication for the 4 known GMs. Detailed auth design TBD.

## High-Level Data Flow
1. **Client (Next.js)** sends JSON requests via REST API to the Backend.
2. **Backend (FastAPI)** validates data, enforces business logic, and manages sessions.
3. **Database (PostgreSQL)** stores the campaign graph (nodes, relationships), session logs, and vector embeddings.
4. **AI Layer (Python)** handles entity extraction, vector search (via pgvector), and procedural generation through direct LLM API calls. It reads graph context from the database to build prompts.

## Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Database | PostgreSQL + pgvector | Shared state across GMs, proper concurrency, built-in vector search |
| Backend language | Python | Keeps AI/LLM logic in the same language as the API |
| Frontend framework | Next.js | Rich interactive UI needed for graph visualization |
| Frontend data fetching | SWR | Cache-key-based invalidation fits the campaign graph's read-heavy, mutation-sparse pattern |
| UI components | shadcn/ui (canary) | Tailwind v4-compatible; unstyled primitives we can theme to parchment palette |
| AI orchestration | Direct API calls | Simpler to debug and maintain than LangChain for current scope |
| Multi-tenancy | Single shared campaign | Simplifies scope — all 4 GMs see and edit the same graph |
| Conflict resolution | Last-write-wins | Good enough for a small trusted group; avoids CRDT/OT complexity |
| Content format | Markdown in `description` fields | Enables rich text (headings, links, lists) while staying plain text in the DB. Frontend renders with a Markdown editor (e.g. Tiptap, Milkdown). Structured data stays in `properties` JSONB. |
| Node types | Free-form string, not enum | Types are user-defined; sidebar and form autocomplete from `GET /types` (live campaign data) |

## Project Structure

```
network-gm/
├── docker-compose.yml        # DB (pgvector) + backend services
├── docs/                     # Spec and architecture documents
├── frontend/
│   ├── .env.local            # NEXT_PUBLIC_API_URL, NEXT_PUBLIC_CAMPAIGN_ID
│   ├── components.json       # shadcn/ui config
│   └── src/
│       ├── app/
│       │   ├── layout.tsx            # Root layout — AppShell + TooltipProvider
│       │   ├── globals.css           # Parchment palette CSS vars + shadcn base
│       │   ├── page.tsx              # Redirects to /nodes
│       │   └── nodes/
│       │       ├── page.tsx          # Node list (SWR, search, archived toggle)
│       │       ├── new/page.tsx      # Create node form
│       │       └── [id]/
│       │           ├── page.tsx      # Node detail (properties, tags, edge list)
│       │           └── edit/page.tsx # Edit node form
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppShell.tsx      # CSS grid: fixed sidebar + scrollable main
│       │   │   └── Sidebar.tsx       # Nav links (dynamic types from API), active state
│       │   ├── nodes/
│       │   │   ├── NodeCard.tsx      # List item card → links to detail page
│       │   │   ├── NodeFilters.tsx   # Search input + archived toggle
│       │   │   ├── NodeForm.tsx      # Shared create/edit form
│       │   │   ├── NodeTypeBadge.tsx # Colored type pill
│       │   │   ├── TagBadge.tsx      # Single tag badge
│       │   │   ├── TagInput.tsx      # Autocomplete tag input with free-form override
│       │   │   ├── PropertiesEditor.tsx # Key-value string pair editor
│       │   │   └── ArchiveConfirm.tsx   # Soft-archive confirmation dialog
│       │   └── edges/
│       │       ├── EdgeList.tsx      # Tabbed edge list (All/Outgoing/Incoming)
│       │       ├── EdgeListItem.tsx  # Direction arrow + type + weight dots
│       │       └── EdgeForm.tsx      # Dialog: node search, type, weight slider
│       ├── lib/
│       │   ├── api.ts        # Typed fetch wrappers for all backend endpoints
│       │   ├── constants.ts  # NODE_TYPES defaults, NODE_TYPE_COLORS, palette tokens
│       │   └── utils.ts      # shadcn cn() utility
│       └── types/
│           └── index.ts      # TypeScript interfaces (Node, Edge, EdgeWithNames, etc.)
└── backend/
    ├── main.py               # FastAPI app — CORS middleware + all routers under /api/v1
    ├── requirements.txt
    ├── Dockerfile
    ├── alembic.ini
    ├── pytest.ini            # asyncio_mode=auto, session loop scope
    ├── .env.example          # DATABASE_URL template for local dev
    ├── alembic/
    │   ├── env.py            # Async Alembic env
    │   └── versions/
    │       └── 001_initial_schema.py   # nodes + edges + pgvector + HNSW index
    ├── app/
    │   ├── config.py         # Settings: reads DATABASE_URL from env (required, no default)
    │   ├── database.py       # Async engine, session factory, get_db dependency
    │   ├── models/           # SQLAlchemy ORM models (Node, Edge)
    │   ├── schemas/          # Pydantic v2 request/response schemas
    │   ├── crud/             # DB query functions (nodes, edges, graph)
    │   └── routers/          # HTTP route handlers (nodes, edges, tags, types, graph)
    └── tests/
        ├── conftest.py       # Test DB setup, TRUNCATE between tests, get_db override
        ├── test_nodes.py     # 7 tests: CRUD, campaign scoping, archive, updated_at
        ├── test_edges.py     # 6 tests: create, cross-campaign 404, direction, delete
        └── test_graph.py     # 8 tests: empty campaign, archive exclusion, subgraph depth, tags
```

## Frontend Notes

### Campaign scoping
The frontend is single-campaign. The campaign UUID is set via `NEXT_PUBLIC_CAMPAIGN_ID` in `.env.local`. There is no campaigns table — `campaign_id` is just a UUID column on `nodes`, so any valid UUID works as a campaign identifier.

### CORS
`allow_origins=["http://localhost:3000"]` is set in `main.py`. When auth (JWT/sessions) is added, `allow_credentials=True` will also be required — see [issue #3](https://github.com/DoktorMJ/network-gm/issues/3).

### SWR cache key conventions
```
["/nodes", filters]              # node list
["/nodes", id]                   # single node
[`/nodes/${id}/edges`, direction] # edge list per direction tab
"/tags"                          # tag autocomplete
"/types"                         # type autocomplete (sidebar + NodeForm)
```
