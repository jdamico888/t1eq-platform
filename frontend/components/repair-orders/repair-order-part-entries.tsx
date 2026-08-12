import type { RepairOrderPartEntry } from "@/types/repair-orders";

import RepairOrderPartEntryCard from "./repair-order-part-entry-card";

type RepairOrderPartEntriesProps = {
  partEntries: RepairOrderPartEntry[];
  onDelete?: (partEntry: RepairOrderPartEntry) => void;
};

export default function RepairOrderPartEntries({
  partEntries,
  onDelete,
}: RepairOrderPartEntriesProps) {
  if (partEntries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
        <div className="text-lg font-semibold text-white">
          No Parts Entries
        </div>

        <div className="mt-2 text-sm text-white/60">
          Parts entries will appear here.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {partEntries.map((partEntry) => (
        <RepairOrderPartEntryCard
          key={partEntry.id}
          partEntry={partEntry}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}