import { cn } from "@/lib/utils";

interface Props {
  tag: string;
  className?: string;
}

export default function TagBadge({ tag, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-[#c2c485] text-[#555] bg-[#FFFCF5]",
        className
      )}
    >
      {tag}
    </span>
  );
}
