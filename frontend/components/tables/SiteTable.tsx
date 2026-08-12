"use client";

import Link from "next/link";

import { Site } from "@/types/site";

import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";

type SiteTableProps = {
  sites: Site[];

  onEdit?: (site: Site) => void;

  onDelete?: (site: Site) => void;
};

export default function SiteTable({
  sites,
  onEdit,
  onDelete,
}: SiteTableProps) {
  return (
    <DataTable
      data={sites}
      emptyMessage="No sites found."
      columns={[
        {
          key: "name",
          header: "Site",
          render: (site) => (
            <div>
              <Link
                href={`/sites/${site.id}`}
                className="font-medium text-cyan-300 hover:text-cyan-200"
              >
                {site.name}
              </Link>

              <div className="mt-1 text-xs text-slate-400">
                {site.customerName}
              </div>
            </div>
          ),
        },

        {
          key: "address",
          header: "Location",
          render: (site) => (
            <div className="text-sm">
              {[site.city, site.state]
                .filter(Boolean)
                .join(", ") || "-"}
            </div>
          ),
        },

        {
          key: "contactName",
          header: "Contact",
          render: (site) => (
            <div>
              <div className="text-sm">
                {site.contactName || "-"}
              </div>

              {site.phone && (
                <div className="mt-1 text-xs text-slate-400">
                  {site.phone}
                </div>
              )}
            </div>
          ),
        },

        {
          key: "email",
          header: "Email",
          render: (site) => (
            <div className="text-sm">
              {site.email || "-"}
            </div>
          ),
        },

        {
          key: "status",
          header: "Status",
          render: () => (
            <StatusBadge status="Active" />
          ),
        },

        {
          key: "actions",
          header: "Actions",
          className: "text-right",
          render: (site) => (
            <div className="flex justify-end gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={() =>
                    onEdit(site)
                  }
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs transition hover:bg-white/10"
                >
                  Edit
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={() =>
                    onDelete(site)
                  }
                  className="rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-300 transition hover:bg-red-500/10"
                >
                  Delete
                </button>
              )}
            </div>
          ),
        },
      ]}
    />
  );
}