"use client";

import { useEffect, useMemo, useState } from "react";

import { getCustomers, type Customer } from "@/services/customers";

type CustomerSelectorProps = {
  value?: string;
  onSelect: (customer: Customer) => void;
  placeholder?: string;
};

export default function CustomerSelector({
  value,
  onSelect,
  placeholder = "Search customer...",
}: CustomerSelectorProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setCustomers(getCustomers());
  }, []);

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return customers;

    return customers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(normalizedSearch) ||
        Boolean(
          customer.phone?.toLowerCase().includes(normalizedSearch)
        ) ||
        Boolean(
          customer.email?.toLowerCase().includes(normalizedSearch)
        )
      );
    });
  }, [customers, search]);

  function handleSelect(customer: Customer) {
    setSearch(customer.name);
    setIsOpen(false);
    onSelect(customer);
  }

  return (
    <div className="relative">
      <input
        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none transition focus:border-cyan-500"
        placeholder={placeholder}
        value={search}
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          setSearch(event.target.value);
          setIsOpen(true);
        }}
      />

      {isOpen && (
        <div className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
          {filteredCustomers.length === 0 && (
            <div className="px-4 py-3 text-sm text-slate-400">
              No customers found.
            </div>
          )}

          {filteredCustomers.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => handleSelect(customer)}
              className="block w-full border-b border-white/5 px-4 py-3 text-left transition hover:bg-white/10"
            >
              <div className="font-medium">
                {customer.name}
              </div>

              <div className="mt-1 text-xs text-slate-400">
                {customer.phone}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}