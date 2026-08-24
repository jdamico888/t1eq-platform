"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  getTruckStockTransactions,
  type TruckStockTransaction,
} from "@/services/truck-stock-transactions";

const QBIT_SCOPE = "truck-stock-transactions";

const formatDateTime = (value?: string) => {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

export default function TruckStockTransactionsPage() {
  const [transactions, setTransactions] = useState<TruckStockTransaction[]>([]);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    setTransactions(getTruckStockTransactions());
  }, []);

  const filteredTransactions = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    if (!search) {
      return transactions;
    }

    return transactions.filter((transaction) => {
      return (
        transaction.type.toLowerCase().includes(search) ||
        transaction.truckName.toLowerCase().includes(search) ||
        transaction.partNumber.toLowerCase().includes(search) ||
        transaction.description.toLowerCase().includes(search) ||
        (transaction.notes ?? "").toLowerCase().includes(search) ||
        (transaction.createdBy ?? "").toLowerCase().includes(search)
      );
    });
  }, [transactions, searchText]);

  const totals = useMemo(() => {
    const loadCount = transactions.filter(
      (transaction) => transaction.type === "Load"
    ).length;

    const consumptionCount = transactions.filter(
      (transaction) => transaction.type === "Consumption"
    ).length;

    const adjustmentCount = transactions.filter(
      (transaction) => transaction.type === "Adjustment"
    ).length;

    const totalQuantityMoved = transactions.reduce(
      (total, transaction) => total + Math.abs(transaction.quantity),
      0
    );

    return {
      totalTransactions: transactions.length,
      loadCount,
      consumptionCount,
      adjustmentCount,
      totalQuantityMoved,
    };
  }, [transactions]);

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <section data-t1eq-tile="true" data-t1eq-page-card="true"
          data-t1eq-qbit-type="page-card"
          data-t1eq-qbit-id="truck-stock-transactions-header"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <div
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="truck-stock-transactions-overline"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="text-sm font-semibold uppercase tracking-[0.25em] text-white/50"
              >
                T1EQ Field Inventory
              </div>

              <h1
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="truck-stock-transactions-title"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="mt-2 text-4xl font-bold text-white"
              >
                Truck Stock Transactions
              </h1>

              <p
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="truck-stock-transactions-description"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="mt-2 max-w-3xl text-sm leading-6 text-white/60"
              >
                Review all truck stock movement history including loads,
                repair-order consumption, restorations, and field count
                adjustments.
              </p>
            </div>

            <Link
              href="/truck-stock"
              data-t1eq-qbit-type="action-button"
              data-t1eq-qbit-id="truck-stock-transactions-back"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Back to Truck Stock
            </Link>
          </div>
        </section>

        <section
          data-t1eq-qbit-type="section"
          data-t1eq-qbit-id="truck-stock-transactions-metrics"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"
        >
          <div data-t1eq-tile="true" data-t1eq-page-card="true"
            data-t1eq-qbit-type="page-card"
            data-t1eq-qbit-id="truck-stock-transactions-metric-total"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="rounded-2xl border border-white/10 bg-white/10 p-5">
            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="truck-stock-transactions-metric-total-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-xs uppercase tracking-wide text-white/50"
            >
              Transactions
            </div>

            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="truck-stock-transactions-metric-total-value"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 text-3xl font-bold text-white"
            >
              {totals.totalTransactions}
            </div>
          </div>

          <div data-t1eq-tile="true" data-t1eq-page-card="true"
            data-t1eq-qbit-type="page-card"
            data-t1eq-qbit-id="truck-stock-transactions-metric-loads"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="rounded-2xl border border-white/10 bg-white/10 p-5">
            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="truck-stock-transactions-metric-loads-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-xs uppercase tracking-wide text-white/50"
            >
              Loads
            </div>

            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="truck-stock-transactions-metric-loads-value"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 text-3xl font-bold text-white"
            >
              {totals.loadCount}
            </div>
          </div>

          <div data-t1eq-tile="true" data-t1eq-page-card="true"
            data-t1eq-qbit-type="page-card"
            data-t1eq-qbit-id="truck-stock-transactions-metric-consumption"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="rounded-2xl border border-white/10 bg-white/10 p-5">
            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="truck-stock-transactions-metric-consumption-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-xs uppercase tracking-wide text-white/50"
            >
              Consumption
            </div>

            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="truck-stock-transactions-metric-consumption-value"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 text-3xl font-bold text-white"
            >
              {totals.consumptionCount}
            </div>
          </div>

          <div data-t1eq-tile="true" data-t1eq-page-card="true"
            data-t1eq-qbit-type="page-card"
            data-t1eq-qbit-id="truck-stock-transactions-metric-adjustments"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="rounded-2xl border border-white/10 bg-white/10 p-5">
            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="truck-stock-transactions-metric-adjustments-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-xs uppercase tracking-wide text-white/50"
            >
              Adjustments
            </div>

            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="truck-stock-transactions-metric-adjustments-value"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 text-3xl font-bold text-white"
            >
              {totals.adjustmentCount}
            </div>
          </div>

          <div data-t1eq-tile="true" data-t1eq-page-card="true"
            data-t1eq-qbit-type="page-card"
            data-t1eq-qbit-id="truck-stock-transactions-metric-qty-moved"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="rounded-2xl border border-white/10 bg-white/10 p-5">
            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="truck-stock-transactions-metric-qty-moved-label"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-xs uppercase tracking-wide text-white/50"
            >
              Qty Moved
            </div>

            <div
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="truck-stock-transactions-metric-qty-moved-value"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 text-3xl font-bold text-white"
            >
              {totals.totalQuantityMoved}
            </div>
          </div>
        </section>

        <section data-t1eq-tile="true" data-t1eq-page-card="true"
          data-t1eq-qbit-type="page-card"
          data-t1eq-qbit-id="truck-stock-transactions-history"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="truck-stock-transactions-history-title"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="text-2xl font-bold text-white"
              >
                Transaction History
              </h2>

              <p
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="truck-stock-transactions-history-description"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="mt-1 text-sm text-white/60"
              >
                Search by truck, part number, description, type, note, or user.
              </p>
            </div>

            <input data-t1eq-field="true"
              data-t1eq-qbit-type="field"
              data-t1eq-qbit-id="truck-stock-transactions-search"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white md:max-w-md"
              placeholder="Search transactions"
            />
          </div>

          {filteredTransactions.length === 0 ? (
            <div data-t1eq-tile="true" data-t1eq-page-card="true"
              data-t1eq-qbit-type="page-card"
              data-t1eq-qbit-id="truck-stock-transactions-empty"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-10 text-center text-white/60">
              No truck stock transactions found.
            </div>
          ) : (
            <div data-t1eq-tile="true" data-t1eq-page-card="true"
              data-t1eq-qbit-type="section"
              data-t1eq-qbit-id="truck-stock-transactions-table"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="overflow-hidden rounded-2xl border border-white/10">
              <div className="grid grid-cols-7 gap-3 border-b border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white/50">
                <div>Type</div>
                <div>Truck</div>
                <div>Part</div>
                <div>Qty</div>
                <div>Before</div>
                <div>After</div>
                <div>Date</div>
              </div>

              <div className="divide-y divide-white/10">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    data-t1eq-qbit-type="tile"
                    data-t1eq-qbit-id={`truck-stock-transaction-${transaction.id}`}
                    data-t1eq-qbit-scope={QBIT_SCOPE}
                    className="grid grid-cols-7 gap-3 px-4 py-4 text-sm text-white/80"
                  >
                    <div>
                      <div className="font-semibold text-white">
                        {transaction.type}
                      </div>

                      {transaction.createdBy && (
                        <div className="mt-1 text-xs text-white/40">
                          By {transaction.createdBy}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="font-medium text-white">
                        {transaction.truckName}
                      </div>

                      <div className="mt-1 text-xs text-white/40">
                        {transaction.truckId}
                      </div>
                    </div>

                    <div>
                      <div className="font-medium text-white">
                        {transaction.partNumber}
                      </div>

                      <div className="mt-1 text-xs text-white/50">
                        {transaction.description}
                      </div>
                    </div>

                    <div>{transaction.quantity}</div>

                    <div>{transaction.previousQuantity}</div>

                    <div>{transaction.newQuantity}</div>

                    <div>
                      <div>{formatDateTime(transaction.createdDate)}</div>

                      {transaction.notes && (
                        <div className="mt-1 text-xs text-white/50">
                          {transaction.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}