"use client";

import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

export interface PropertyRow {
  key: string;
  value: string;
}

interface Props {
  rows: PropertyRow[];
  onChange: (rows: PropertyRow[]) => void;
}

export default function PropertiesEditor({ rows, onChange }: Props) {
  function addRow() {
    onChange([...rows, { key: "", value: "" }]);
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  function updateRow(index: number, field: "key" | "value", val: string) {
    onChange(rows.map((r, i) => (i === index ? { ...r, [field]: val } : r)));
  }

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input
            placeholder="key"
            value={row.key}
            onChange={(e) => updateRow(i, "key", e.target.value)}
            className="flex-1 bg-white border-[#e8dfc0] text-sm"
          />
          <Input
            placeholder="value"
            value={row.value}
            onChange={(e) => updateRow(i, "value", e.target.value)}
            className="flex-1 bg-white border-[#e8dfc0] text-sm"
          />
          <button
            type="button"
            onClick={() => removeRow(i)}
            className="text-[#ccc] hover:text-red-500 transition-colors shrink-0"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1.5 text-sm text-[#246c27] hover:text-[#1d5920] transition-colors mt-1"
      >
        <Plus size={14} />
        Add property
      </button>
    </div>
  );
}
