"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createNode } from "@/lib/api";
import type { NodeCreate } from "@/types";
import NodeForm from "@/components/nodes/NodeForm";

export default function NewNodePage() {
  const router = useRouter();

  async function handleSubmit(data: NodeCreate) {
    const node = await createNode(data);
    router.push(`/nodes/${node.id}`);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href="/nodes" className="inline-flex items-center gap-1 text-sm text-[#888] hover:text-[#246c27] mb-5 transition-colors">
        <ArrowLeft size={14} />
        All Nodes
      </Link>

      <h2 className="text-2xl font-bold text-[#222] mb-6">New Node</h2>

      <NodeForm onSubmit={handleSubmit} submitLabel="Create Node" />
    </div>
  );
}
