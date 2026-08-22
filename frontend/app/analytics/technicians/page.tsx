"use client";

import { useEffect, useMemo, useState } from "react";

import PageContainer from "../../components/layout/PageContainer";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import ListCard from "../../components/ui/ListCard";
import MetricCard from "../../components/ui/MetricCard";

import {
  calculateLaborEntryTotalAmount,
  calculateLaborEntryTotalHours,
  getLaborEntries,
} from "../../../services/labor-entries";

import { getActiveTechnicianProfiles } from "../../../services/technician-profiles";

import type { LaborEntry } from "../../../types/labor-entry";
import type { TechnicianProfile } from "../../../types/technician-profile";

type TechnicianAnalytics = {
  technicianId: string;
  technicianName: string;
  laborEntryCount: number;
  laborHours: number;
  laborRevenue: number;
  averageRevenuePerHour: number;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
};

export default function TechnicianAnalyticsPage() {
  const [technicians, setTechnicians] = useState<TechnicianProfile[]>([]);
  const [laborEntries, setLaborEntries] = useState<LaborEntry[]>([]);

  useEffect(() => {
    setTechnicians(getActiveTechnicianProfiles());
    setLaborEntries(getLaborEntries());
  }, []);

  const analytics = useMemo<TechnicianAnalytics[]>(() => {
    return technicians.map((technician) => {
      const technicianName = technician.displayName;

      const technicianLaborEntries = laborEntries.filter(
        (laborEntry) => laborEntry.technicianId === technician.id
      );

      const laborHours = calculateLaborEntryTotalHours(
        technicianLaborEntries
      );

      const laborRevenue = calculateLaborEntryTotalAmount(
        technicianLaborEntries
      );

      const averageRevenuePerHour =
        laborHours > 0 ? laborRevenue / laborHours : 0;

      return {
        technicianId: technician.id,
        technicianName,
        laborEntryCount: technicianLaborEntries.length,
        laborHours,
        laborRevenue,
        averageRevenuePerHour,
      };
    });
  }, [technicians, laborEntries]);

  const totals = useMemo(() => {
    const totalLaborEntries = analytics.reduce(
      (total, item) => total + item.laborEntryCount,
      0
    );

    const totalLaborHours = analytics.reduce(
      (total, item) => total + item.laborHours,
      0
    );

    const totalLaborRevenue = analytics.reduce(
      (total, item) => total + item.laborRevenue,
      0
    );

    const averageRevenuePerHour =
      totalLaborHours > 0 ? totalLaborRevenue / totalLaborHours : 0;

    return {
      technicianCount: technicians.length,
      totalLaborEntries,
      totalLaborHours,
      totalLaborRevenue,
      averageRevenuePerHour,
    };
  }, [analytics, technicians.length]);

  return (
    <PageContainer>
      <div>
        <h1 className="text-5xl font-bold text-black">
          Technician Analytics
        </h1>

        <p className="mt-2 text-lg text-black/70">
          Labor productivity, labor entry activity, and technician revenue.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <MetricCard label="Technicians" value={totals.technicianCount} />

        <MetricCard label="Labor Entries" value={totals.totalLaborEntries} />

        <MetricCard
          label="Labor Hours"
          value={totals.totalLaborHours.toFixed(1)}
        />

        <MetricCard
          label="Labor Revenue"
          value={formatCurrency(totals.totalLaborRevenue)}
        />

        <MetricCard
          label="Avg / Hour"
          value={formatCurrency(totals.averageRevenuePerHour)}
        />
      </div>

      <Card className="text-black">
        <div className="space-y-5">
          <h2 className="text-3xl font-bold">Technician Performance</h2>

          <div className="space-y-4">
            {analytics.length === 0 && (
              <EmptyState
                title="No technician analytics available"
                message="Add technicians and labor entries to generate analytics."
              />
            )}

            {analytics.map((technicianAnalytics) => (
              <ListCard
                key={technicianAnalytics.technicianId}
                className="cursor-default"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">
                      {technicianAnalytics.technicianName}
                    </div>

                    <div className="text-black/60">
                      Labor Entries: {technicianAnalytics.laborEntryCount}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 text-right">
                    <div>
                      <div className="text-sm text-black/60">Hours</div>

                      <div className="text-2xl font-bold">
                        {technicianAnalytics.laborHours.toFixed(1)}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-black/60">Revenue</div>

                      <div className="text-2xl font-bold">
                        {formatCurrency(technicianAnalytics.laborRevenue)}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-black/60">Avg / Hr</div>

                      <div className="text-2xl font-bold">
                        {formatCurrency(
                          technicianAnalytics.averageRevenuePerHour
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </ListCard>
            ))}
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}