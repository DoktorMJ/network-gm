"use client";

import { use } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Archive, Plus, ArrowLeft } from "lucide-react";
import { getNode, archiveNode } from "@/lib/api";
import NodeTypeBadge from "@/components/nodes/NodeTypeBadge";
import TagBadge from "@/components/nodes/TagBadge";
import EdgeList from "@/components/edges/EdgeList";
import ArchiveConfirm from "@/components/nodes/ArchiveConfirm";
import EdgeForm from "@/components/edges/EdgeForm";
import { useState } from "react";

interface Props {
  params: Promise<{ id: string }>;
}

export default function NodeDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showEdgeForm, setShowEdgeForm] = useState(false);

  const { data: node, isLoading, error } = useSWR(
    ["/nodes", id],
    ([, nodeId]) => getNode(nodeId)
  );

  async function handleArchive() {
    await archiveNode(id);
    globalMutate(["/nodes", {}]);
    router.push("/nodes");
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-[#f5f0e8] rounded animate-pulse" />
          <div className="h-4 w-full bg-[#f5f0e8] rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-[#f5f0e8] rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !node) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error?.message ?? "Node not found"}
        </div>
      </div>
    );
  }

  const propertyEntries = Object.entries(node.properties ?? {});

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Back link */}
      <Link href="/nodes" className="inline-flex items-center gap-1 text-sm text-[#888] hover:text-[#246c27] mb-5 transition-colors">
        <ArrowLeft size={14} />
        All Nodes
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <NodeTypeBadge type={node.type} />
            {node.is_archived && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                archived
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-[#222]">{node.name}</h1>
        </div>

        {/* Actions */}
        <div className="flex gap-2 shrink-0">
          <Link href={`/nodes/${id}/edit`}>
            <button className="flex items-center gap-1.5 px-3 py-2 border border-[#e8dfc0] rounded-md text-sm text-[#555] hover:border-[#246c27]/50 hover:text-[#246c27] transition-colors">
              <Pencil size={14} />
              Edit
            </button>
          </Link>
          {!node.is_archived && (
            <button
              onClick={() => setShowArchiveDialog(true)}
              className="flex items-center gap-1.5 px-3 py-2 border border-[#e8dfc0] rounded-md text-sm text-[#888] hover:border-red-300 hover:text-red-600 transition-colors"
            >
              <Archive size={14} />
              Archive
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      {node.description && (
        <p className="text-[#444] mb-6 leading-relaxed">{node.description}</p>
      )}

      {/* Tags */}
      {node.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {node.tags.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
      )}

      {/* Properties */}
      {propertyEntries.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-[#888] uppercase tracking-wider mb-3">Properties</h3>
          <div className="rounded-lg border border-[#e8dfc0] overflow-hidden">
            {propertyEntries.map(([key, value], i) => (
              <div
                key={key}
                className={`flex gap-4 px-4 py-2.5 text-sm ${i % 2 === 0 ? "bg-white" : "bg-[#faf7ef]"}`}
              >
                <span className="text-[#888] font-medium w-36 shrink-0">{key}</span>
                <span className="text-[#333]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Relationships */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#888] uppercase tracking-wider">Relationships</h3>
          <button
            onClick={() => setShowEdgeForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#246c27] text-white rounded-md hover:bg-[#1d5920] transition-colors"
          >
            <Plus size={13} />
            Add
          </button>
        </div>
        <EdgeList nodeId={id} />
      </div>

      {/* Meta */}
      <div className="mt-8 pt-6 border-t border-[#e8dfc0] text-xs text-[#bbb] space-y-1">
        <p>Created: {new Date(node.created_at).toLocaleString()}</p>
        <p>Updated: {new Date(node.updated_at).toLocaleString()}</p>
      </div>

      {/* Dialogs */}
      <ArchiveConfirm
        open={showArchiveDialog}
        nodeName={node.name}
        onConfirm={handleArchive}
        onCancel={() => setShowArchiveDialog(false)}
      />

      <EdgeForm
        open={showEdgeForm}
        sourceNodeId={id}
        onClose={() => setShowEdgeForm(false)}
        onCreated={() => globalMutate([`/nodes/${id}/edges`, "all"])}
      />
    </div>
  );
}
