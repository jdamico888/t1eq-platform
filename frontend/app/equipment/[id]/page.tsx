"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { useParams } from "next/navigation";

import PageContainer from "@/components/layout/PageContainer";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import Field from "../../components/ui/Field";
import Input from "../../components/ui/Input";
import ListCard from "../../components/ui/ListCard";
import MetricCard from "../../components/ui/MetricCard";
import Textarea from "../../components/ui/Textarea";

import { Equipment } from "../../../types/equipment";
import { RepairOrder } from "../../../types/repair-orders";

import {
  getEquipment,
  updateEquipment,
} from "../../../services/equipment";

import {
  getRepairOrders,
} from "../../../services/repair-orders";

import {
  formatDate,
} from "../../utils/format";

export default function EquipmentDetailPage() {
  const params = useParams();

  const equipmentId = params.id as string;

  const [equipment, setEquipment] =
    useState<Equipment | null>(null);

  const [repairOrders, setRepairOrders] =
    useState<RepairOrder[]>([]);

  useEffect(() => {
    const foundEquipment =
      getEquipment().find(
        (item) => item.id === equipmentId
      ) || null;

    setEquipment(foundEquipment);

    if (!foundEquipment) {
      setRepairOrders([]);
      return;
    }

    const equipmentDisplayName =
      [
        foundEquipment.manufacturer,
        foundEquipment.model,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

    setRepairOrders(
      getRepairOrders().filter(
        (repairOrder) =>
          repairOrder.equipmentId === equipmentId ||
          repairOrder.equipmentName === equipmentDisplayName
      )
    );
  }, [equipmentId]);

  function handleUpdateEquipment(
    updatedEquipment: Equipment
  ) {
    updateEquipment(updatedEquipment);
    setEquipment(updatedEquipment);
  }

  function handleFieldChange(
    field: keyof Equipment,
    value: string
  ) {
    if (!equipment) {
      return;
    }

    const updatedEquipment: Equipment = {
      ...equipment,
      [field]: value,
      updatedDate: new Date().toISOString(),
    };

    handleUpdateEquipment(updatedEquipment);
  }

  const metrics = useMemo(() => {
    const openRepairOrders =
      repairOrders.filter(
        (repairOrder) =>
          repairOrder.status !== "Completed" &&
          repairOrder.status !== "Cancelled"
      );

    const completedRepairOrders =
      repairOrders.filter(
        (repairOrder) =>
          repairOrder.status === "Completed"
      );

    return {
      totalRepairOrders: repairOrders.length,
      openRepairOrders: openRepairOrders.length,
      completedRepairOrders: completedRepairOrders.length,
    };
  }, [repairOrders]);

  if (!equipment) {
    return (
      <PageContainer>
        <EmptyState
          title="Equipment not found"
          message="This equipment record could not be found in the local equipment registry."
        />
      </PageContainer>
    );
  }

  const displayName =
    [
      equipment.manufacturer,
      equipment.model,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    "Equipment Record";

  return (
    <PageContainer>
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-5xl font-bold text-black">
            {displayName}
          </h1>

          <p className="text-black/70 mt-2 text-lg">
            Equipment detail, ownership, and service history
          </p>
        </div>

        <Link
          href="/equipment"
          className="
            rounded-xl
            border
            border-black/20
            bg-white/25
            px-5
            py-3
            font-semibold
            text-black
            hover:bg-white/35
            transition
          "
        >
          Back to Equipment
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard
          label="Repair Orders"
          value={metrics.totalRepairOrders}
        />

        <MetricCard
          label="Open RO's"
          value={metrics.openRepairOrders}
        />

        <MetricCard
          label="Completed"
          value={metrics.completedRepairOrders}
        />
      </div>

      <Card className="text-black">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">
            Equipment Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="Manufacturer">
              <Input
                value={equipment.manufacturer || ""}
                onChange={(value) =>
                  handleFieldChange(
                    "manufacturer",
                    value
                  )
                }
                placeholder="Manufacturer"
              />
            </Field>

            <Field label="Model">
              <Input
                value={equipment.model || ""}
                onChange={(value) =>
                  handleFieldChange(
                    "model",
                    value
                  )
                }
                placeholder="Model"
              />
            </Field>

            <Field label="Serial Number">
              <Input
                value={equipment.serialNumber || ""}
                onChange={(value) =>
                  handleFieldChange(
                    "serialNumber",
                    value
                  )
                }
                placeholder="Serial Number"
              />
            </Field>

            <Field label="Category">
              <Input
                value={equipment.category || ""}
                onChange={(value) =>
                  handleFieldChange(
                    "category",
                    value
                  )
                }
                placeholder="Category"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Customer Name">
              <Input
                value={equipment.customerName || ""}
                onChange={(value) =>
                  handleFieldChange(
                    "customerName",
                    value
                  )
                }
                placeholder="Customer Name"
              />
            </Field>

            <Field label="Site Name">
              <Input
                value={equipment.siteName || ""}
                onChange={(value) =>
                  handleFieldChange(
                    "siteName",
                    value
                  )
                }
                placeholder="Site Name"
              />
            </Field>

            <Field label="Status">
              <Input
                value={equipment.status || ""}
                onChange={(value) =>
                  handleFieldChange(
                    "status",
                    value
                  )
                }
                placeholder="Status"
              />
            </Field>
          </div>

          <Field label="Notes">
            <Textarea
              value={equipment.notes || ""}
              onChange={(value) =>
                handleFieldChange(
                  "notes",
                  value
                )
              }
              placeholder="Equipment notes"
              rows={4}
            />
          </Field>
        </div>
      </Card>

      <Card className="text-black">
        <div className="space-y-5">
          <h2 className="text-3xl font-bold">
            Service History
          </h2>

          <div className="space-y-4">
            {repairOrders.length === 0 && (
              <EmptyState
                title="No repair orders found"
                message="Repair orders connected to this equipment will appear here."
              />
            )}

            {repairOrders.map((repairOrder) => (
              <Link
                key={repairOrder.id}
                href={`/repair-orders/${repairOrder.ro}`}
              >
                <ListCard>
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2">
                      <div className="text-2xl font-bold">
                        {repairOrder.ro}
                      </div>

                      <div className="text-black/70">
                        {repairOrder.customerName}
                      </div>

                      <div className="text-black/60">
                        {repairOrder.siteName}
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <div className="font-bold">
                        {repairOrder.status}
                      </div>

                      <div className="text-black/50 text-sm">
                        {formatDate(
                          repairOrder.createdDate
                        )}
                      </div>
                    </div>
                  </div>
                </ListCard>
              </Link>
            ))}
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}