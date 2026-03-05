"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Input } from "@/components/ui/input";
import { listTypes } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { NodeFilters as NodeFiltersType } from "@/types";

interface Props {
  filters: NodeFiltersType;
  onChange: (filters: NodeFiltersType) => void;
}

export default function NodeFilters({ filters, onChange }: Props) {
  const [searchInput, setSearchInput] = useState(filters.search ?? "");

  // Keep listTypes imported so the SWR cache stays warm for the sidebar
  useSWR("/types", listTypes);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange({ ...filters, search: searchInput || undefined });
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  function toggleArchived() {
    onChange({ ...filters, is_archived: filters.is_archived ? undefined : true });
  }

  return (
    <div className="flex gap-3 items-center">
      <Input
        placeholder="Search nodes…"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className="bg-white border-[#e8dfc0] focus-visible:ring-[#246c27]/30"
      />
      <button
        onClick={toggleArchived}
        className={cn(
          "shrink-0 px-3 py-2 rounded-md text-sm border transition-colors",
          filters.is_archived
            ? "bg-[#888] text-white border-[#888]"
            : "bg-white text-[#999] border-[#e8dfc0] hover:border-[#999]"
        )}
      >
        {filters.is_archived ? "Archived only" : "Show archived"}
      </button>
    </div>
  );
}
