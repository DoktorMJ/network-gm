"use client";

import { useState, useRef } from "react";
import useSWR from "swr";
import { listTags } from "@/lib/api";
import { X } from "lucide-react";

interface Props {
  value: string[];
  onChange: (tags: string[]) => void;
}

export default function TagInput({ value, onChange }: Props) {
  const [inputText, setInputText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: allTags = [] } = useSWR("/tags", () => listTags());

  const filteredSuggestions = allTags.filter(
    (t) => t.toLowerCase().includes(inputText.toLowerCase()) && !value.includes(t)
  );

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputText("");
    setIsOpen(false);
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputText.trim()) addTag(inputText);
    } else if (e.key === "Backspace" && inputText === "") {
      onChange(value.slice(0, -1));
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div className="relative">
      <div
        className="flex flex-wrap gap-1.5 min-h-[38px] px-3 py-2 border border-[#e8dfc0] rounded-md bg-white cursor-text focus-within:ring-1 focus-within:ring-[#246c27]/30"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-[#c2c485] text-[#555] bg-[#FFFCF5]"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              className="text-[#aaa] hover:text-[#555]"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => { setInputText(e.target.value); setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          placeholder={value.length === 0 ? "Add tags…" : ""}
          className="flex-1 min-w-[80px] text-sm outline-none bg-transparent"
        />
      </div>

      {isOpen && inputText && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-[#e8dfc0] rounded-md shadow-sm max-h-40 overflow-y-auto">
          {filteredSuggestions.length > 0 ? (
            filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onMouseDown={() => addTag(suggestion)}
                className="w-full px-3 py-2 text-sm text-left hover:bg-[#f5f0e8] text-[#333]"
              >
                {suggestion}
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-xs text-[#aaa]">
              Press Enter to add "{inputText}" as a new tag
            </p>
          )}
        </div>
      )}
    </div>
  );
}
