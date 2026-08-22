import type { RepairOrderLaborEntry } from "@/types/repair-orders";

import RepairOrderLaborEntryCard from "./repair-order-labor-entry-card";

type RepairOrderLaborEntriesProps = {
  laborEntries: RepairOrderLaborEntry[];
  onDelete?: (laborEntry: RepairOrderLaborEntry) => void;
};

export default function RepairOrderLaborEntries({
  laborEntries,
  onDelete,
}: RepairOrderLaborEntriesProps) {
  if (laborEntries.length === 0) {
    return (
      <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
        <div className="text-lg font-semibold text-white">
          No Labor Entries
        </div>

        <div className="mt-2 text-sm text-white/60">
          Labor entries will appear here.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {laborEntries.map((laborEntry) => (
        <RepairOrderLaborEntryCard
          key={laborEntry.id}
          laborEntry={laborEntry}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}