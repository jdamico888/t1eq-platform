type TechnicianStatusItem = {
  id: string;

  technicianName: string;

  status: string;

  activeJobs?: number;

  certifications?: number;
};

type TechnicianStatusPanelProps = {
  technicians: TechnicianStatusItem[];
};

function getStatusClasses(
  status: string
): string {
  const normalizedStatus =
    status.toLowerCase();

  if (
    normalizedStatus.includes(
      "active"
    )
  ) {
    return "bg-emerald-500";
  }

  if (
    normalizedStatus.includes(
      "vacation"
    )
  ) {
    return "bg-amber-500";
  }

  if (
    normalizedStatus.includes(
      "inactive"
    ) ||
    normalizedStatus.includes(
      "sick"
    )
  ) {
    return "bg-red-500";
  }

  return "bg-cyan-500";
}

export default function TechnicianStatusPanel({
  technicians,
}: TechnicianStatusPanelProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          Technician Status
        </h2>

        <div className="text-sm text-slate-400">
          {technicians.length} Technicians
        </div>
      </div>

      <div className="space-y-4">
        {technicians.length ===
          0 && (
          <div className="text-sm text-slate-400">
            No technicians found.
          </div>
        )}

        {technicians.map(
          (technician) => (
            <div
              key={
                technician.id
              }
              className="rounded-2xl border border-white/5 bg-black/20 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">
                    {
                      technician.technicianName
                    }
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {typeof technician.activeJobs ===
                      "number" && (
                      <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                        {
                          technician.activeJobs
                        }{" "}
                        Active Jobs
                      </div>
                    )}

                    {typeof technician.certifications ===
                      "number" && (
                      <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                        {
                          technician.certifications
                        }{" "}
                        Certifications
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full ${getStatusClasses(
                      technician.status
                    )}`}
                  />

                  <div className="text-sm text-slate-300">
                    {
                      technician.status
                    }
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}