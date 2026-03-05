import type { Node, NodeCreate, NodeUpdate, Edge, EdgeWithNames, EdgeCreate, EdgeUpdate, NodeFilters } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const CAMPAIGN_ID = process.env.NEXT_PUBLIC_CAMPAIGN_ID;

function base() {
  return `${API_URL}/api/v1/campaigns/${CAMPAIGN_ID}`;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "API error");
  }
  return res.json() as Promise<T>;
}

// --- Nodes ---

export function listNodes(filters?: NodeFilters): Promise<Node[]> {
  const params = new URLSearchParams();
  if (filters?.type) params.set("type", filters.type);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.tags?.length) params.set("tags", filters.tags.join(","));
  if (filters?.is_archived !== undefined) params.set("is_archived", String(filters.is_archived));
  const qs = params.toString();
  return apiFetch<Node[]>(`/nodes${qs ? `?${qs}` : ""}`);
}

export function getNode(id: string): Promise<Node> {
  return apiFetch<Node>(`/nodes/${id}`);
}

export function createNode(data: NodeCreate): Promise<Node> {
  return apiFetch<Node>("/nodes", { method: "POST", body: JSON.stringify(data) });
}

export function updateNode(id: string, data: NodeUpdate): Promise<Node> {
  return apiFetch<Node>(`/nodes/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export function archiveNode(id: string): Promise<Node> {
  return apiFetch<Node>(`/nodes/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ is_archived: true }),
  });
}

// --- Edges ---

export function listEdgesForNode(
  nodeId: string,
  direction?: "all" | "outgoing" | "incoming"
): Promise<EdgeWithNames[]> {
  const params = new URLSearchParams();
  if (direction && direction !== "all") params.set("direction", direction);
  const qs = params.toString();
  return apiFetch<EdgeWithNames[]>(`/nodes/${nodeId}/edges${qs ? `?${qs}` : ""}`);
}

export function createEdge(data: EdgeCreate): Promise<Edge> {
  return apiFetch<Edge>("/edges", { method: "POST", body: JSON.stringify(data) });
}

export function updateEdge(id: string, data: EdgeUpdate): Promise<Edge> {
  return apiFetch<Edge>(`/edges/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export function deleteEdge(id: string): Promise<void> {
  return apiFetch<void>(`/edges/${id}`, { method: "DELETE" });
}

// --- Tags ---

export async function listTags(): Promise<string[]> {
  const res = await apiFetch<{ tags: string[] }>("/tags");
  return res.tags;
}

// --- Types ---

export async function listTypes(): Promise<string[]> {
  const res = await apiFetch<{ tags: string[] }>("/types");
  return res.tags;
}

// --- SWR fetcher helpers (key → fetcher mapping) ---

export const swrFetchers = {
  nodes: ([, filters]: [string, NodeFilters]) => listNodes(filters),
  node: ([, id]: [string, string]) => getNode(id),
  nodeEdges: ([, id, direction]: [string, string, string]) =>
    listEdgesForNode(id, direction as "all" | "outgoing" | "incoming"),
  tags: () => listTags(),
};
