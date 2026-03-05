import Link from "next/link";
import type { Node } from "@/types";
import NodeTypeBadge from "./NodeTypeBadge";
import TagBadge from "./TagBadge";

interface Props {
  node: Node;
}

export default function NodeCard({ node }: Props) {
  return (
    <Link href={`/nodes/${node.id}`}>
      <div className="flex items-start gap-3 px-4 py-3 border border-[#e8dfc0] rounded-lg bg-white hover:border-[#246c27]/40 hover:shadow-sm transition-all cursor-pointer">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <NodeTypeBadge type={node.type} />
            <span className="font-medium text-[#222] truncate">{node.name}</span>
          </div>
          {node.description && (
            <p className="text-sm text-[#666] line-clamp-2 mb-2">{node.description}</p>
          )}
          {node.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {node.tags.map((tag) => (
                <TagBadge key={tag} tag={tag} />
              ))}
            </div>
          )}
        </div>
        {node.is_archived && (
          <span className="text-xs text-[#999] italic shrink-0">archived</span>
        )}
      </div>
    </Link>
  );
}
