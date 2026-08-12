type InvoiceAgingItem = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  status: string;
  dueDate?: string;
};

type InvoiceAgingPanelProps = {
  invoices: InvoiceAgingItem[];
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default function InvoiceAgingPanel({
  invoices,
}: InvoiceAgingPanelProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Invoice Aging</h2>

        <div className="text-sm text-slate-400">{invoices.length} Open</div>
      </div>

      <div className="space-y-4">
        {invoices.length === 0 && (
          <div className="text-sm text-slate-400">No open invoices.</div>
        )}

        {invoices.map((invoice) => (
          <div
            key={invoice.id}
            className="rounded-2xl border border-white/5 bg-black/20 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-medium text-cyan-300">
                  {invoice.invoiceNumber}
                </div>

                <div className="mt-1 text-sm">{invoice.customerName}</div>

                {invoice.dueDate && (
                  <div className="mt-1 text-xs text-slate-400">
                    Due: {invoice.dueDate}
                  </div>
                )}
              </div>

              <div className="text-right">
                <div className="font-semibold">
                  {formatCurrency(invoice.totalAmount)}
                </div>

                <div className="mt-1 text-xs text-slate-400">
                  {invoice.status}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}