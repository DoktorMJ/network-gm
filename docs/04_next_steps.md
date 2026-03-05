# Next Steps & Handover

## Current State (as of 2026-03-05)

The product is usable. A GM can open the browser and manage their campaign world end-to-end.

| Layer | Status |
|---|---|
| Backend CRUD API | ✅ Complete — 21 passing tests |
| Frontend CRUD UI (Slice 1) | ✅ Complete — merged to main |
| Graph visualization | ❌ Not started |
| AI / embeddings | ❌ Not started |
| Auth | ❌ Not started |

## What Was Just Built

A parchment-themed browser UI: node list with search + sidebar type navigation, node detail page, create/edit forms (tag autocomplete, free-form type combobox, key-value properties), edge management (add/delete relationships with weight), soft-archive. Single campaign, configured via `NEXT_PUBLIC_CAMPAIGN_ID` env var.

## Open Issues

- [#2](https://github.com/DoktorMJ/network-gm/issues/2) — EdgeForm fetches all nodes; should lazy-search via `?search=` param at scale
- [#3](https://github.com/DoktorMJ/network-gm/issues/3) — CORS needs `allow_credentials=True` when auth is added
- `NodeForm.onSubmit` uses `any` type — clean up before codebase grows

## Suggested Next Slices

### Slice 2 — Graph Visualization
Render the campaign as an interactive node graph. Recommended library: **React Flow** (MIT, well-maintained, works with Next.js). Data comes from the existing `GET /graph` endpoint. Start with: render nodes + edges, click node to open detail panel, basic pan/zoom. No layout algorithm needed to start — React Flow's built-in dagre/force layouts cover it.

### Slice 3 — AI Layer
Wire up embeddings on node create/update (Gemini `text-embedding-004`, 768 dims — column already exists in DB). Then implement semantic search (`GET /search/semantic`) using pgvector cosine similarity. Entry point: `backend/app/crud/nodes.py` + a new `ai/` module.

### Slice 4 — Auth
Simple JWT auth for the 4 known GMs. FastAPI has good JWT middleware support. See [#3](https://github.com/DoktorMJ/network-gm/issues/3) for the CORS change needed alongside this.

## Running Locally

```bash
# Backend
docker compose up

# Frontend
cd frontend
# Set NEXT_PUBLIC_CAMPAIGN_ID in .env.local to any UUID
npm run dev   # → http://localhost:3000
```

## Key Files for Context

- `docs/01_architecture.md` — full project structure + decisions
- `docs/03_api_contracts.md` — all API endpoints
- `frontend/src/lib/api.ts` — all frontend API calls
- `backend/main.py` — FastAPI app entrypoint
- `backend/app/routers/` — route handlers
