"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  nodeName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ArchiveConfirm({ open, nodeName, onConfirm, onCancel }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="bg-[#FFFCF5] border-[#e8dfc0]">
        <DialogHeader>
          <DialogTitle>Archive "{nodeName}"?</DialogTitle>
          <DialogDescription>
            This node will be hidden from the default list but not deleted. You can view archived
            nodes by enabling the "Show archived" filter.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-[#e8dfc0] rounded-md text-sm text-[#555] hover:bg-[#f5f0e8] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
          >
            Archive
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
