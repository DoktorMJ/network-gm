import { ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { EdgeWithNames } from "@/types";

interface Props {
  edge: EdgeWithNames;
  nodeId: string;
  onDelete?: (id: string) => void;
}

function WeightDots({ weight }: { weight: number }) {
  return (
    <span className="text-xs text-[#888] font-mono tracking-tight">
      {"●".repeat(Math.min(weight, 10))}{"○".repeat(Math.max(0, 10 - weight))}
    </span>
  );
}

export default function EdgeListItem({ edge, nodeId, onDelete }: Props) {
  const isOutgoing = edge.source_node_id === nodeId;
  const linkedNodeId = isOutgoing ? edge.target_node_id : edge.source_node_id;
  const linkedNodeName = isOutgoing ? edge.target_node_name : edge.source_node_name;

  return (
    <div className="flex items-center gap-3 px-4 py-3 border border-[#e8dfc0] rounded-lg bg-white hover:border-[#246c27]/30 transition-all group">
      {/* Direction arrow */}
      <span className={`shrink-0 ${isOutgoing ? "text-[#246c27]" : "text-blue-500"}`}>
        {isOutgoing ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
      </span>

      {/* Edge type */}
      <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded bg-[#f5f0e8] text-[#555] border border-[#e8dfc0]">
        {edge.type}
      </span>

      {/* Linked node */}
      <Link
        href={`/nodes/${linkedNodeId}`}
        className="flex-1 text-sm font-medium text-[#246c27] hover:underline truncate"
        onClick={(e) => e.stopPropagation()}
      >
        {linkedNodeName}
      </Link>

      {/* Weight */}
      <WeightDots weight={edge.weight} />

      {/* Delete */}
      {onDelete && (
        <button
          onClick={() => onDelete(edge.id)}
          className="opacity-0 group-hover:opacity-100 text-[#bbb] hover:text-red-500 transition-all text-xs px-1"
          title="Remove relationship"
        >
          ✕
        </button>
      )}
    </div>
  );
}
