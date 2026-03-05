"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listNodes, createEdge } from "@/lib/api";
import type { Node } from "@/types";

interface Props {
  open: boolean;
  sourceNodeId: string;
  onClose: () => void;
  onCreated: () => void;
}

export default function EdgeForm({ open, sourceNodeId, onClose, onCreated }: Props) {
  const [searchText, setSearchText] = useState("");
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [edgeType, setEdgeType] = useState("");
  const [weight, setWeight] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch nodes for target search
  const { data: allNodes = [] } = useSWR(
    open ? ["/nodes", {}] : null,
    ([, filters]) => listNodes(filters)
  );

  const filteredNodes = allNodes.filter(
    (n) =>
      n.id !== sourceNodeId &&
      n.name.toLowerCase().includes(searchText.toLowerCase())
  );

  function handleClose() {
    setSearchText("");
    setSelectedNode(null);
    setEdgeType("");
    setWeight(1);
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedNode) { setError("Select a target node."); return; }
    if (!edgeType.trim()) { setError("Edge type is required."); return; }
    setError(null);
    setSubmitting(true);
    try {
      await createEdge({
        source_node_id: sourceNodeId,
        target_node_id: selectedNode.id,
        type: edgeType.trim(),
        weight,
      });
      onCreated();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create relationship.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="bg-[#FFFCF5] border-[#e8dfc0] max-w-md">
        <DialogHeader>
          <DialogTitle>Add Relationship</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Target node search */}
          <div className="space-y-1.5">
            <Label>Target Node</Label>
            {selectedNode ? (
              <div className="flex items-center gap-2 p-2.5 rounded-md border border-[#246c27]/40 bg-[#246c27]/5">
                <span className="text-sm font-medium text-[#222] flex-1">{selectedNode.name}</span>
                <span className="text-xs text-[#888]">{selectedNode.type}</span>
                <button
                  type="button"
                  onClick={() => setSelectedNode(null)}
                  className="text-xs text-[#aaa] hover:text-[#555]"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  placeholder="Search for a node…"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="bg-white border-[#e8dfc0]"
                />
                {searchText && filteredNodes.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-[#e8dfc0] rounded-md shadow-sm max-h-40 overflow-y-auto">
                    {filteredNodes.slice(0, 10).map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => { setSelectedNode(n); setSearchText(""); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[#f5f0e8] text-left"
                      >
                        <span className="flex-1 font-medium text-[#222]">{n.name}</span>
                        <span className="text-xs text-[#888]">{n.type}</span>
                      </button>
                    ))}
                  </div>
                )}
                {searchText && filteredNodes.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-[#e8dfc0] rounded-md shadow-sm">
                    <p className="px-3 py-2 text-sm text-[#aaa]">No nodes found.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Edge type */}
          <div className="space-y-1.5">
            <Label htmlFor="edge-type">Relationship Type *</Label>
            <Input
              id="edge-type"
              value={edgeType}
              onChange={(e) => setEdgeType(e.target.value)}
              placeholder="e.g. ally, enemy, knows, located_in"
              className="bg-white border-[#e8dfc0]"
            />
          </div>

          {/* Weight */}
          <div className="space-y-1.5">
            <Label htmlFor="weight">
              Weight{" "}
              <span className="text-[#aaa] font-normal ml-1 text-xs font-mono">
                {"●".repeat(weight)}{"○".repeat(10 - weight)}
              </span>
            </Label>
            <input
              id="weight"
              type="range"
              min={1}
              max={10}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full accent-[#246c27]"
            />
            <div className="flex justify-between text-xs text-[#aaa]">
              <span>1 (weak)</span>
              <span>10 (strong)</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-[#e8dfc0] rounded-md text-sm text-[#555] hover:bg-[#f5f0e8] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#246c27] text-white rounded-md text-sm font-medium hover:bg-[#1d5920] transition-colors disabled:opacity-60"
            >
              {submitting ? "Adding…" : "Add Relationship"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
