"use client";

import { useState } from "react";
import useSWR from "swr";
import { listEdgesForNode, deleteEdge } from "@/lib/api";
import EdgeListItem from "./EdgeListItem";
import { cn } from "@/lib/utils";

type Direction = "all" | "outgoing" | "incoming";

interface Props {
  nodeId: string;
}

const TABS: { label: string; value: Direction }[] = [
  { label: "All", value: "all" },
  { label: "Outgoing", value: "outgoing" },
  { label: "Incoming", value: "incoming" },
];

export default function EdgeList({ nodeId }: Props) {
  const [direction, setDirection] = useState<Direction>("all");

  const { data: edges, isLoading, mutate } = useSWR(
    [`/nodes/${nodeId}/edges`, direction],
    ([, dir]) => listEdgesForNode(nodeId, dir as Direction)
  );

  async function handleDelete(edgeId: string) {
    await deleteEdge(edgeId);
    mutate();
  }

  return (
    <div>
      {/* Direction tabs */}
      <div className="flex gap-1 mb-4 border-b border-[#e8dfc0] pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setDirection(tab.value)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              direction === tab.value
                ? "bg-[#246c27] text-white"
                : "text-[#666] hover:bg-[#f5f0e8]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-[#f5f0e8] rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {edges && edges.length === 0 && (
        <p className="text-sm text-[#999] py-4 text-center">No relationships yet.</p>
      )}

      {edges && edges.length > 0 && (
        <div className="space-y-2">
          {edges.map((edge) => (
            <EdgeListItem
              key={edge.id}
              edge={edge}
              nodeId={nodeId}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
