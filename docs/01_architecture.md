# System Architecture

## Tech Stack
- **Backend:** Python / FastAPI
- **Database:** PostgreSQL with `pgvector` extension
- **Frontend:** Next.js (React) / Tailwind CSS
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
| AI orchestration | Direct API calls | Simpler to debug and maintain than LangChain for current scope |
| Multi-tenancy | Single shared campaign | Simplifies scope — all 4 GMs see and edit the same graph |
| Conflict resolution | Last-write-wins | Good enough for a small trusted group; avoids CRDT/OT complexity |
| Content format | Markdown in `description` fields | Enables rich text (headings, links, lists) while staying plain text in the DB. Frontend renders with a Markdown editor (e.g. Tiptap, Milkdown). Structured data stays in `properties` JSONB. |

## Project Structure (To Be Updated)
*(Will be filled in as the codebase is generated.)*
