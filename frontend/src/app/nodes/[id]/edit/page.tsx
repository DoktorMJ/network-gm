"use client";

import { use } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getNode, updateNode } from "@/lib/api";
import type { NodeUpdate } from "@/types";
import NodeForm from "@/components/nodes/NodeForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditNodePage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const { data: node, isLoading, error } = useSWR(
    ["/nodes", id],
    ([, nodeId]) => getNode(nodeId)
  );

  async function handleSubmit(data: NodeUpdate) {
    await updateNode(id, data);
    router.push(`/nodes/${id}`);
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-[#f5f0e8] rounded animate-pulse" />
          <div className="h-64 bg-[#f5f0e8] rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !node) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error?.message ?? "Node not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href={`/nodes/${id}`} className="inline-flex items-center gap-1 text-sm text-[#888] hover:text-[#246c27] mb-5 transition-colors">
        <ArrowLeft size={14} />
        Back to {node.name}
      </Link>

      <h2 className="text-2xl font-bold text-[#222] mb-6">Edit Node</h2>

      <NodeForm initial={node} onSubmit={handleSubmit} submitLabel="Save Changes" />
    </div>
  );
}
