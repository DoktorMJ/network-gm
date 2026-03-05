import { cn } from "@/lib/utils";
import { NODE_TYPE_COLORS } from "@/lib/constants";

interface Props {
  type: string;
  className?: string;
}

export default function NodeTypeBadge({ type, className }: Props) {
  const colors = NODE_TYPE_COLORS[type] ?? { bg: "bg-gray-100", text: "text-gray-700" };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        colors.bg,
        colors.text,
        className
      )}
    >
      {type}
    </span>
  );
}
