import Link from "next/link";

type RecentCustomer = {
  id: string;

  name: string;

  city?: string;

  state?: string;

  phone?: string;

  createdDate?: string;
};

type RecentCustomersPanelProps = {
  customers: RecentCustomer[];
};

export default function RecentCustomersPanel({
  customers,
}: RecentCustomersPanelProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          Recent Customers
        </h2>

        <div className="text-sm text-slate-400">
          {customers.length} Records
        </div>
      </div>

      <div className="space-y-4">
        {customers.length === 0 && (
          <div className="text-sm text-slate-400">
            No customers found.
          </div>
        )}

        {customers.map((customer) => (
          <Link
            key={customer.id}
            href={`/customers/${customer.id}`}
            className="block rounded-2xl border border-white/5 bg-black/20 p-4 transition hover:border-cyan-500/30 hover:bg-white/5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-medium text-cyan-300">
                  {customer.name}
                </div>

                <div className="mt-1 text-sm text-slate-400">
                  {[customer.city, customer.state]
                    .filter(Boolean)
                    .join(", ") || "-"}
                </div>

                {customer.phone && (
                  <div className="mt-1 text-xs text-slate-500">
                    {customer.phone}
                  </div>
                )}
              </div>

              {customer.createdDate && (
                <div className="text-right text-xs text-slate-500">
                  {new Date(
                    customer.createdDate
                  ).toLocaleDateString()}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}