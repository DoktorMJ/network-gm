"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Plus } from "lucide-react";
import { listNodes } from "@/lib/api";
import type { NodeFilters } from "@/types";
import NodeCard from "@/components/nodes/NodeCard";
import NodeFiltersComponent from "@/components/nodes/NodeFilters";
import { useSearchParams } from "next/navigation";

export default function NodesPage() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<NodeFilters>({
    type: searchParams.get("type") ?? undefined,
  });

  useEffect(() => {
    setFilters((prev) => ({ ...prev, type: searchParams.get("type") ?? undefined }));
  }, [searchParams]);

  const { data: nodes, isLoading, error } = useSWR(
    ["/nodes", filters],
    ([, f]) => listNodes(f)
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#222]">Nodes</h2>
          <p className="text-sm text-[#888] mt-0.5">
            {nodes ? `${nodes.length} node${nodes.length !== 1 ? "s" : ""}` : "Loading…"}
          </p>
        </div>
        <Link href="/nodes/new">
          <button className="flex items-center gap-1.5 px-4 py-2 bg-[#246c27] text-white rounded-md text-sm font-medium hover:bg-[#1d5920] transition-colors">
            <Plus size={15} />
            New Node
          </button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-5">
        <NodeFiltersComponent filters={filters} onChange={setFilters} />
      </div>

      {/* List */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-[#f5f0e8] rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          Failed to load nodes: {error.message}
        </div>
      )}

      {nodes && nodes.length === 0 && (
        <div className="text-center py-16 text-[#999]">
          <p className="text-lg mb-2">No nodes yet</p>
          <p className="text-sm mb-4">Create your first NPC, location, or event to get started.</p>
          <Link href="/nodes/new">
            <button className="px-4 py-2 bg-[#246c27] text-white rounded-md text-sm hover:bg-[#1d5920] transition-colors">
              Create your first node
            </button>
          </Link>
        </div>
      )}

      {nodes && nodes.length > 0 && (
        <div className="space-y-3">
          {nodes.map((node) => (
            <NodeCard key={node.id} node={node} />
          ))}
        </div>
      )}
    </div>
  );
}
