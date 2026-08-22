"use client";

import { useEffect, useMemo, useState } from "react";

import { getCustomers } from "@/services/customers";

type CustomerOption = {
  id: string;
  name: string;
};

type CustomerSelectorProps = {
  value: string;
  onChange: (value: string) => void;

  label?: string;
  placeholder?: string;

  qbitId?: string;
  qbitScope?: string;

  disabled?: boolean;
  required?: boolean;

  className?: string;
};

export default function CustomerSelector({
  value,
  onChange,
  label = "Customer",
  placeholder = "Select Customer",
  qbitId,
  qbitScope = "global",
  disabled = false,
  required = false,
  className = "",
}: CustomerSelectorProps) {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);

  useEffect(() => {
    const customerRecords = getCustomers();

    setCustomers(
      customerRecords.map((customer) => ({
        id: customer.id,
        name: customer.name,
      }))
    );
  }, []);

  const sortedCustomers = useMemo(
    () =>
      [...customers].sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    [customers]
  );

  return (
    <label
      data-t1eq-qbit-type={qbitId ? "section" : undefined}
      data-t1eq-qbit-id={
        qbitId ? `${qbitId}-wrapper` : undefined
      }
      data-t1eq-qbit-scope={
        qbitId ? qbitScope : undefined
      }
      className="block"
    >
      {label && (
        <span
          data-t1eq-qbit-type={
            qbitId ? "text" : undefined
          }
          data-t1eq-qbit-id={
            qbitId ? `${qbitId}-label` : undefined
          }
          data-t1eq-qbit-scope={
            qbitId ? qbitScope : undefined
          }
          className="mb-1 block text-sm font-medium"
        >
          {label}
        </span>
      )}

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        disabled={disabled}
        required={required}
        data-t1eq-field="true"
        data-t1eq-qbit-type="field"
        data-t1eq-qbit-id={qbitId || undefined}
        data-t1eq-qbit-scope={
          qbitId ? qbitScope : undefined
        }
        className={`w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-black outline-none transition focus:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        <option value="">
          {placeholder}
        </option>

        {sortedCustomers.map((customer) => (
          <option
            key={customer.id}
            value={customer.name}
          >
            {customer.name}
          </option>
        ))}
      </select>
    </label>
  );
}