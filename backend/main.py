from fastapi import FastAPI

from app.schemas.common import HealthCheckResponse
from app.routers import nodes, edges, tags, graph

app = FastAPI(title="Network GM API", version="0.1.0")

# --- Health check ---
@app.get("/api/v1/ping", response_model=HealthCheckResponse)
async def ping():
    return HealthCheckResponse(status="ok", message="Network GM Backend is running")

# --- Campaign-scoped routers ---
PREFIX = "/api/v1/campaigns/{campaign_id}"

app.include_router(nodes.router, prefix=f"{PREFIX}/nodes", tags=["nodes"])
app.include_router(edges.router, prefix=PREFIX, tags=["edges"])
app.include_router(tags.router, prefix=f"{PREFIX}/tags", tags=["tags"])
app.include_router(graph.router, prefix=f"{PREFIX}/graph", tags=["graph"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
