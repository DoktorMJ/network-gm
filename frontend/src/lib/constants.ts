export const NODE_TYPES = ["NPC", "Location", "Event", "Faction", "Item"] as const;

export type NodeType = (typeof NODE_TYPES)[number];

export const NODE_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  NPC:      { bg: "bg-amber-100",   text: "text-amber-800"  },
  Location: { bg: "bg-green-100",   text: "text-green-800"  },
  Event:    { bg: "bg-blue-100",    text: "text-blue-800"   },
  Faction:  { bg: "bg-purple-100",  text: "text-purple-800" },
  Item:     { bg: "bg-rose-100",    text: "text-rose-800"   },
};

// Parchment palette tokens (reference — applied via CSS vars in globals.css)
export const PALETTE = {
  bg:        "#FFFCF5",
  text:      "#222222",
  primary:   "#246c27",
  secondary: "#d1c49f",
  accent:    "#c2c485",
} as const;
