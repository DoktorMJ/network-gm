"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Network, Tag } from "lucide-react";
import useSWR from "swr";
import { cn } from "@/lib/utils";
import { listTypes } from "@/lib/api";
import { NODE_TYPES } from "@/lib/constants";

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentType = searchParams.get("type");

  const { data: existingTypes = [] } = useSWR("/types", listTypes);
  const allTypes = Array.from(new Set([...NODE_TYPES, ...existingTypes]));

  const isAllActive = pathname === "/nodes" && !currentType;

  return (
    <aside className="flex flex-col h-full bg-[#d1c49f] border-r border-[#c2c485]">
      {/* App name */}
      <div className="px-5 py-5 border-b border-[#c2c485]">
        <h1 className="text-lg font-bold text-[#222222] tracking-tight">Network GM</h1>
        <p className="text-xs text-[#555] mt-0.5 truncate">
          Campaign: {process.env.NEXT_PUBLIC_CAMPAIGN_ID?.slice(0, 8) ?? "—"}…
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        <Link href="/nodes/new">
          <span className="flex items-center gap-2 px-3 py-2 mb-3 rounded-md bg-[#246c27] text-white text-sm font-medium hover:bg-[#1d5920] transition-colors cursor-pointer">
            + New Node
          </span>
        </Link>

        {/* All Nodes */}
        <Link href="/nodes">
          <span className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer",
            isAllActive
              ? "text-[#246c27] border-l-2 border-[#246c27] bg-[#FFFCF5]/50 font-medium"
              : "text-[#444] hover:bg-[#c2c485]/40 hover:text-[#222]"
          )}>
            <Network size={15} />
            All Nodes
          </span>
        </Link>

        {/* Per-type links */}
        {allTypes.map((type) => {
          const isActive = pathname === "/nodes" && currentType === type;
          return (
            <Link key={type} href={`/nodes?type=${type}`}>
              <span className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer",
                isActive
                  ? "text-[#246c27] border-l-2 border-[#246c27] bg-[#FFFCF5]/50 font-medium"
                  : "text-[#444] hover:bg-[#c2c485]/40 hover:text-[#222]"
              )}>
                <Tag size={15} />
                {type}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[#c2c485]">
        <p className="text-xs text-[#888]">Network GM v0.1</p>
      </div>
    </aside>
  );
}
