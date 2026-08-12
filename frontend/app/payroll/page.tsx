"use client";

import { useEffect, useMemo, useState } from "react";

import PageContainer from "../components/layout/PageContainer";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import MetricCard from "../components/ui/MetricCard";

import { getActiveTechnicianProfiles } from "@/services/technician-profiles";
import { calculateTechnicianPayrollSummary } from "@/services/technician-payroll";

import type { TechnicianProfile } from "@/types/technician-profile";
import type { TechnicianPayrollSummary } from "@/services/technician-payroll";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
};

export default function PayrollPage() {
  const [technicians, setTechnicians] = useState<TechnicianProfile[]>([]);

  useEffect(() => {
    setTechnicians(getActiveTechnicianProfiles());
  }, []);

  const payrollSummaries = useMemo<TechnicianPayrollSummary[]>(() => {
    return technicians.map((technician) =>
      calculateTechnicianPayrollSummary(technician)
    );
  }, [technicians]);

  const totals = useMemo(() => {
    return payrollSummaries.reduce(
      (totals, summary) => {
        totals.laborHours += summary.laborHours;
        totals.laborAmount += summary.laborAmount;
        totals.mileage += summary.mileageReimbursement;
        totals.grossPay += summary.grossPay;

        return totals;
      },
      {
        laborHours: 0,
        laborAmount: 0,
        mileage: 0,
        grossPay: 0,
      }
    );
  }, [payrollSummaries]);

  return (
    <PageContainer>
      <div>
        <h1 className="text-5xl font-bold text-black">
          Payroll
        </h1>

        <p className="mt-2 text-lg text-black/70">
          Technician compensation, mileage reimbursement,
          and payroll calculations.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label="Labor Hours"
          value={totals.laborHours.toFixed(1)}
        />

        <MetricCard
          label="Labor Amount"
          value={formatCurrency(totals.laborAmount)}
        />

        <MetricCard
          label="Mileage"
          value={formatCurrency(totals.mileage)}
        />

        <MetricCard
          label="Gross Payroll"
          value={formatCurrency(totals.grossPay)}
        />
      </div>

      <Card className="text-black">
        <div className="space-y-5">
          <div>
            <h2 className="text-3xl font-bold">
              Technician Payroll
            </h2>

            <p className="mt-1 text-sm text-black/60">
              Payroll summaries generated from labor,
              mileage, and technician compensation profiles.
            </p>
          </div>

          {payrollSummaries.length === 0 && (
            <EmptyState
              title="No payroll data available"
              message="Create technician profiles, labor entries, and mileage entries to generate payroll."
            />
          )}

          <div className="space-y-4">
            {payrollSummaries.map((summary) => (
              <div
                key={summary.technicianId}
                className="rounded-2xl border border-black/10 bg-black/[0.03] p-5"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-black/50">
                      Technician
                    </div>

                    <div className="mt-1 text-2xl font-bold">
                      {summary.technicianName || "Unknown"}
                    </div>

                    <div className="mt-2 text-sm text-black/60">
                      {summary.compensationType}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-4">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-black/50">
                        Hours
                      </div>

                      <div className="mt-1 text-xl font-bold">
                        {summary.laborHours.toFixed(1)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-wide text-black/50">
                        Labor
                      </div>

                      <div className="mt-1 text-xl font-bold">
                        {formatCurrency(summary.laborAmount)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-wide text-black/50">
                        Mileage
                      </div>

                      <div className="mt-1 text-xl font-bold">
                        {formatCurrency(
                          summary.mileageReimbursement
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-wide text-black/50">
                        Gross Pay
                      </div>

                      <div className="mt-1 text-xl font-bold">
                        {formatCurrency(summary.grossPay)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}