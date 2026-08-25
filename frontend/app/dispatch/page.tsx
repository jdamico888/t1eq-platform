"use client";

import { useMemo } from "react";

import PageContainer from "@/components/layout/PageContainer";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import MetricCard from "../components/ui/MetricCard";
import StatusBadge from "../components/ui/StatusBadge";

import {
  getDispatchJobs,
  getDispatchableRepairOrders,
  getDispatchedRepairOrders,
  getScheduledRepairOrders,
  getUnassignedDispatchRepairOrders,
} from "@/services/dispatch";

import { getStatusTone } from "../utils/status-tone";

const QBIT_SCOPE = "dispatch";

const formatDateTime = (value?: string) => {
  if (!value) return "Not Scheduled";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

export default function DispatchPage() {
  const dispatchJobs = useMemo(() => {
    return getDispatchJobs();
  }, []);

  const dispatchableRepairOrders = useMemo(() => {
    return getDispatchableRepairOrders();
  }, []);

  const dispatchedRepairOrders = useMemo(() => {
    return getDispatchedRepairOrders();
  }, []);

  const scheduledRepairOrders = useMemo(() => {
    return getScheduledRepairOrders();
  }, []);

  const unassignedRepairOrders = useMemo(() => {
    return getUnassignedDispatchRepairOrders();
  }, []);

  return (
    <PageContainer qbitId="dispatch-page" qbitScope={QBIT_SCOPE}>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <h1
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="dispatch-title"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="text-5xl font-bold text-black"
          >
            Dispatch Operations
          </h1>

          <p
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="dispatch-description"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="mt-2 text-lg text-black/70"
          >
            Repair-order-driven dispatch workflow and technician coordination.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <MetricCard
          qbitId="dispatch-metric-queue"
          qbitScope={QBIT_SCOPE}
          label="Dispatch Queue"
          value={dispatchJobs.length}
        />

        <MetricCard
          qbitId="dispatch-metric-ready"
          qbitScope={QBIT_SCOPE}
          label="Ready For Dispatch"
          value={dispatchableRepairOrders.length}
        />

        <MetricCard
          qbitId="dispatch-metric-scheduled"
          qbitScope={QBIT_SCOPE}
          label="Scheduled"
          value={scheduledRepairOrders.length}
        />

        <MetricCard
          qbitId="dispatch-metric-active"
          qbitScope={QBIT_SCOPE}
          label="Active Field Work"
          value={dispatchedRepairOrders.length}
        />

        <MetricCard
          qbitId="dispatch-metric-unassigned"
          qbitScope={QBIT_SCOPE}
          label="Unassigned"
          value={unassignedRepairOrders.length}
        />
      </div>

      <Card qbitId="dispatch-queue-list" qbitScope={QBIT_SCOPE} className="text-black">
        <div className="space-y-5">
          <div>
            <h2
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="dispatch-queue-list-title"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-3xl font-bold"
            >
              Dispatch Queue
            </h2>

            <p
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="dispatch-queue-list-description"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-1 text-sm text-black/60"
            >
              Active repair orders currently participating in dispatch workflow.
            </p>
          </div>

          {dispatchJobs.length === 0 && (
            <EmptyState
              qbitId="dispatch-empty-state"
              qbitScope={QBIT_SCOPE}
              title="No dispatch jobs found"
              message="Repair orders participating in dispatch workflow will appear here."
            />
          )}

          <div className="space-y-4">
            {dispatchJobs.map((dispatchJob) => (
              <div data-t1eq-tile="true" data-t1eq-page-card="true"
                data-t1eq-qbit-type="tile"
                data-t1eq-qbit-id={`dispatch-job-${dispatchJob.id}`}
                data-t1eq-qbit-scope={QBIT_SCOPE}
                key={dispatchJob.id}
                className="rounded-2xl border border-black/10 bg-black/[0.03] p-5"
              >
                <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-black/50">
                        Repair Order
                      </div>

                      <div className="mt-1 text-3xl font-bold">
                        {dispatchJob.repairOrderNumber}
                      </div>
                    </div>

                    <div
                      data-t1eq-tile-grid="true"
                      className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
                    >
                      <div>
                        <div className="text-xs uppercase tracking-wide text-black/50">
                          Customer
                        </div>

                        <div className="mt-1 text-sm font-semibold">
                          {dispatchJob.customerName}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs uppercase tracking-wide text-black/50">
                          Site
                        </div>

                        <div className="mt-1 text-sm font-semibold">
                          {dispatchJob.siteName || "Primary Location"}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs uppercase tracking-wide text-black/50">
                          Technician
                        </div>

                        <div className="mt-1 text-sm font-semibold">
                          {dispatchJob.technicianName || "Unassigned"}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs uppercase tracking-wide text-black/50">
                          Scheduled
                        </div>

                        <div className="mt-1 text-sm font-semibold">
                          {formatDateTime(dispatchJob.scheduledStart)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-3 xl:items-end">
                    <StatusBadge
                      qbitId={`dispatch-job-${dispatchJob.id}-status`}
                      qbitScope={QBIT_SCOPE}
                      label={dispatchJob.status}
                      tone={getStatusTone(dispatchJob.status)}
                    />

                    <div data-t1eq-tile="true" data-t1eq-page-card="true"
                      data-t1eq-qbit-type="text"
                      data-t1eq-qbit-id={`dispatch-job-${dispatchJob.id}-created`}
                      data-t1eq-qbit-scope={QBIT_SCOPE}
                      className="rounded-full border border-black/10 bg-black/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-black/70">
                      Created {formatDateTime(dispatchJob.createdDate)}
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