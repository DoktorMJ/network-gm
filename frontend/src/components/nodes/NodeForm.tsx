"use client";

import { useState, useRef } from "react";
import useSWR from "swr";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NODE_TYPES } from "@/lib/constants";
import { listTypes } from "@/lib/api";
import type { Node } from "@/types";
import TagInput from "./TagInput";
import PropertiesEditor, { type PropertyRow } from "./PropertiesEditor";

interface Props {
  initial?: Node;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => Promise<void>;
  submitLabel?: string;
}

function rowsToProps(rows: PropertyRow[]): Record<string, string> {
  return Object.fromEntries(rows.filter((r) => r.key.trim()).map((r) => [r.key.trim(), r.value]));
}

function propsToRows(props: Record<string, string>): PropertyRow[] {
  return Object.entries(props).map(([key, value]) => ({ key, value }));
}

function TypeCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: existingTypes = [] } = useSWR("/types", listTypes);
  // Merge API types with hardcoded defaults, deduplicate
  const allSuggestions = Array.from(new Set([...NODE_TYPES, ...existingTypes]));
  const filtered = allSuggestions.filter(
    (t) => t.toLowerCase().includes(value.toLowerCase()) && t !== value
  );

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
        placeholder="e.g. NPC, Location…"
        className="bg-white border-[#e8dfc0]"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-[#e8dfc0] rounded-md shadow-sm max-h-40 overflow-y-auto">
          {filtered.map((t) => (
            <button
              key={t}
              type="button"
              onMouseDown={() => { onChange(t); setOpen(false); }}
              className="w-full px-3 py-2 text-sm text-left hover:bg-[#f5f0e8] text-[#333]"
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NodeForm({ initial, onSubmit, submitLabel = "Save" }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState(initial?.type ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [propertyRows, setPropertyRows] = useState<PropertyRow[]>(
    initial?.properties ? propsToRows(initial.properties) : []
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required."); return; }
    if (!type.trim()) { setError("Type is required."); return; }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        type: type.trim(),
        description: description.trim() || undefined,
        tags,
        properties: rowsToProps(propertyRows),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-[1fr_160px] gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Theron Ashvale"
            className="bg-white border-[#e8dfc0]"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="type">Type *</Label>
          <TypeCombobox value={type} onChange={setType} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Who is this? What is this place? What happened here?"
          rows={3}
          className="bg-white border-[#e8dfc0] resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Tags</Label>
        <TagInput value={tags} onChange={setTags} />
      </div>

      <div className="space-y-1.5">
        <Label>Properties</Label>
        <PropertiesEditor rows={propertyRows} onChange={setPropertyRows} />
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 bg-[#246c27] text-white rounded-md text-sm font-medium hover:bg-[#1d5920] transition-colors disabled:opacity-60"
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
