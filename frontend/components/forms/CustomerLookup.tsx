"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Typeahead, { type TypeaheadOption } from "./Typeahead";

import {
  createCustomer,
  getCustomerById,
  getCustomers,
  updateCustomer,
  type Customer,
} from "@/services/customers";

export type CustomerLookupValues = {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  notes: string;
};

export const emptyCustomerLookupValues: CustomerLookupValues = {
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  notes: "",
};

type CustomerLookupProps = {
  value: CustomerLookupValues;
  onChange: (value: CustomerLookupValues) => void;

  matchedCustomerId: string | null;
  onMatchedCustomerIdChange: (id: string | null) => void;

  qbitId?: string;
  qbitScope?: string;

  theme?: "light" | "dark";
};

/**
 * Resolves the customer record this form step should attach to the RO or
 * appointment being created. Called once, at final submit time, by the
 * parent flow. If the user matched (and optionally edited/saved) an
 * existing customer, that record is returned as-is. If no match was ever
 * made, a brand new customer record is created from the entered values.
 */
export function resolveCustomerLookupRecord(
  value: CustomerLookupValues,
  matchedCustomerId: string | null
): Customer {
  if (matchedCustomerId) {
    const existingCustomer = getCustomerById(matchedCustomerId);

    if (existingCustomer) {
      return existingCustomer;
    }
  }

  return createCustomer({
    name: value.name.trim(),
    phone: value.phone.trim() || undefined,
    email: value.email.trim() || undefined,
    address: value.address.trim() || undefined,
    city: value.city.trim() || undefined,
    state: value.state.trim() || undefined,
    zipCode: value.zipCode.trim() || undefined,
    notes: value.notes.trim() || undefined,
  });
}

function customerToLookupValues(customer: Customer): CustomerLookupValues {
  return {
    name: customer.name,
    phone: customer.phone ?? "",
    email: customer.email ?? "",
    address: customer.address ?? "",
    city: customer.city ?? "",
    state: customer.state ?? "",
    zipCode: customer.zipCode ?? "",
    notes: customer.notes ?? "",
  };
}

function valuesAreEqual(
  left: CustomerLookupValues,
  right: CustomerLookupValues
): boolean {
  return (
    left.name === right.name &&
    left.phone === right.phone &&
    left.email === right.email &&
    left.address === right.address &&
    left.city === right.city &&
    left.state === right.state &&
    left.zipCode === right.zipCode &&
    left.notes === right.notes
  );
}

function uniqueFieldOptions(values: (string | undefined)[]): TypeaheadOption[] {
  const seen = new Set<string>();
  const options: TypeaheadOption[] = [];

  values.forEach((value) => {
    const trimmed = (value ?? "").trim();

    if (!trimmed || seen.has(trimmed.toLowerCase())) {
      return;
    }

    seen.add(trimmed.toLowerCase());
    options.push({ id: trimmed, label: trimmed });
  });

  return options;
}

export default function CustomerLookup({
  value,
  onChange,
  matchedCustomerId,
  onMatchedCustomerIdChange,
  qbitId,
  qbitScope = "global",
  theme = "light",
}: CustomerLookupProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const savedSnapshotRef = useRef<CustomerLookupValues | null>(null);

  useEffect(() => {
    setCustomers(getCustomers());
  }, []);

  const customerNameOptions: TypeaheadOption<Customer>[] = useMemo(() => {
    return customers.map((customer) => ({
      id: customer.id,
      label: customer.name,
      sublabel: [customer.phone, customer.city].filter(Boolean).join(" · "),
      data: customer,
    }));
  }, [customers]);

  const phoneOptions = useMemo(
    () => uniqueFieldOptions(customers.map((customer) => customer.phone)),
    [customers]
  );
  const emailOptions = useMemo(
    () => uniqueFieldOptions(customers.map((customer) => customer.email)),
    [customers]
  );
  const addressOptions = useMemo(
    () => uniqueFieldOptions(customers.map((customer) => customer.address)),
    [customers]
  );
  const cityOptions = useMemo(
    () => uniqueFieldOptions(customers.map((customer) => customer.city)),
    [customers]
  );
  const stateOptions = useMemo(
    () => uniqueFieldOptions(customers.map((customer) => customer.state)),
    [customers]
  );
  const zipOptions = useMemo(
    () => uniqueFieldOptions(customers.map((customer) => customer.zipCode)),
    [customers]
  );

  function updateField<K extends keyof CustomerLookupValues>(
    key: K,
    fieldValue: CustomerLookupValues[K]
  ) {
    onChange({ ...value, [key]: fieldValue });
  }

  function handleCustomerSelected(option: TypeaheadOption<Customer>) {
    const customer = option.data;

    if (!customer) {
      return;
    }

    const loadedValues = customerToLookupValues(customer);

    savedSnapshotRef.current = loadedValues;
    onMatchedCustomerIdChange(customer.id);
    onChange(loadedValues);
  }

  function handleStartNewCustomer() {
    savedSnapshotRef.current = null;
    onMatchedCustomerIdChange(null);
    onChange(emptyCustomerLookupValues);
  }

  const isDirty = useMemo(() => {
    if (!matchedCustomerId || !savedSnapshotRef.current) {
      return false;
    }

    return !valuesAreEqual(value, savedSnapshotRef.current);
  }, [value, matchedCustomerId]);

  function handleSaveEdit() {
    if (!matchedCustomerId) {
      return;
    }

    updateCustomer(matchedCustomerId, {
      name: value.name.trim(),
      phone: value.phone.trim() || undefined,
      email: value.email.trim() || undefined,
      address: value.address.trim() || undefined,
      city: value.city.trim() || undefined,
      state: value.state.trim() || undefined,
      zipCode: value.zipCode.trim() || undefined,
      notes: value.notes.trim() || undefined,
    });

    savedSnapshotRef.current = { ...value };
    setCustomers(getCustomers());
  }

  function handleDiscardEdit() {
    if (!savedSnapshotRef.current) {
      return;
    }

    onChange(savedSnapshotRef.current);
  }

  const matchedCustomer = matchedCustomerId
    ? customers.find((customer) => customer.id === matchedCustomerId)
    : undefined;

  return (
    <div
      data-t1eq-qbit-type={qbitId ? "section" : undefined}
      data-t1eq-qbit-id={qbitId ? `${qbitId}-wrapper` : undefined}
      data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
      className="space-y-4"
    >
      <div className="flex items-end justify-between gap-3">
        <div className="flex-1">
          <Typeahead
            qbitId={qbitId ? `${qbitId}-name` : undefined}
            qbitScope={qbitScope}
            theme={theme}
            label="Customer"
            placeholder="Start typing a customer name..."
            value={value.name}
            onChange={(name) => updateField("name", name)}
            onSelect={handleCustomerSelected}
            options={customerNameOptions}
            noMatchHint="No matching customer — this will be added as a new customer."
            required
          />
        </div>

        {matchedCustomerId && (
          <button data-t1eq-action-button="true"
            data-t1eq-qbit-type="action-button"
            data-t1eq-qbit-id={qbitId ? `${qbitId}-start-new` : undefined}
            data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
            type="button"
            onClick={handleStartNewCustomer}
            className={
              theme === "dark"
                ? "shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/10"
                : "shrink-0 rounded-xl border border-black/10 bg-white px-3 py-3 text-sm font-semibold text-black/70 transition hover:bg-zinc-100"
            }
          >
            Different Customer
          </button>
        )}
      </div>

      {isDirty && matchedCustomer && (
        <div data-t1eq-tile="true" data-t1eq-page-card="true"
          data-t1eq-qbit-type="tile"
          data-t1eq-qbit-id={qbitId ? `${qbitId}-save-edit-prompt` : undefined}
          data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
          className={
            theme === "dark"
              ? "rounded-2xl border border-orange-400/20 bg-orange-500/10 p-4"
              : "rounded-2xl border border-orange-200 bg-orange-50 p-4"
          }
        >
          <div
            className={
              theme === "dark"
                ? "text-sm font-semibold text-orange-200"
                : "text-sm font-semibold text-orange-800"
            }
          >
            You've changed {matchedCustomer.name}'s information.
          </div>

          <p
            className={
              theme === "dark"
                ? "mt-1 text-sm text-orange-100/70"
                : "mt-1 text-sm text-orange-700"
            }
          >
            Save these changes to the customer record, or discard them and
            keep the original information on file.
          </p>

          <div className="mt-3 flex flex-wrap gap-3">
            <button data-t1eq-action-button="true"
              data-t1eq-qbit-type="action-button"
              data-t1eq-qbit-id={qbitId ? `${qbitId}-save-edit` : undefined}
              data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
              type="button"
              onClick={handleSaveEdit}
              className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/80"
            >
              Save Edit
            </button>

            <button data-t1eq-action-button="true"
              data-t1eq-qbit-type="action-button"
              data-t1eq-qbit-id={qbitId ? `${qbitId}-discard-edit` : undefined}
              data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
              type="button"
              onClick={handleDiscardEdit}
              className={
                theme === "dark"
                  ? "rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  : "rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-100"
              }
            >
              Discard Changes
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Typeahead
          qbitId={qbitId ? `${qbitId}-phone` : undefined}
          qbitScope={qbitScope}
          theme={theme}
          label="Phone"
          value={value.phone}
          onChange={(phone) => updateField("phone", phone)}
          options={phoneOptions}
        />

        <Typeahead
          qbitId={qbitId ? `${qbitId}-email` : undefined}
          qbitScope={qbitScope}
          theme={theme}
          label="Email"
          value={value.email}
          onChange={(email) => updateField("email", email)}
          options={emailOptions}
        />
      </div>

      <Typeahead
        qbitId={qbitId ? `${qbitId}-address` : undefined}
        qbitScope={qbitScope}
        theme={theme}
        label="Address"
        value={value.address}
        onChange={(address) => updateField("address", address)}
        options={addressOptions}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Typeahead
          qbitId={qbitId ? `${qbitId}-city` : undefined}
          qbitScope={qbitScope}
          theme={theme}
          label="City"
          value={value.city}
          onChange={(city) => updateField("city", city)}
          options={cityOptions}
        />

        <Typeahead
          qbitId={qbitId ? `${qbitId}-state` : undefined}
          qbitScope={qbitScope}
          theme={theme}
          label="State"
          value={value.state}
          onChange={(state) => updateField("state", state)}
          options={stateOptions}
        />

        <Typeahead
          qbitId={qbitId ? `${qbitId}-zip` : undefined}
          qbitScope={qbitScope}
          theme={theme}
          label="Zip Code"
          value={value.zipCode}
          onChange={(zipCode) => updateField("zipCode", zipCode)}
          options={zipOptions}
        />
      </div>

      <label className="block">
        <span
          className={
            theme === "dark"
              ? "text-xs font-semibold uppercase tracking-wide text-white/50"
              : "mb-1 block text-sm font-medium text-black"
          }
        >
          Notes
        </span>

        <textarea data-t1eq-field="true"
          data-t1eq-qbit-type="field"
          data-t1eq-qbit-id={qbitId ? `${qbitId}-notes` : undefined}
          data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
          value={value.notes}
          onChange={(event) => updateField("notes", event.target.value)}
          rows={3}
          className={
            theme === "dark"
              ? "mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-400/60"
              : "mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-black outline-none transition focus:border-cyan-500"
          }
        />
      </label>
    </div>
  );
}
