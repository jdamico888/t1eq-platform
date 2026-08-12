"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { useParams } from "next/navigation";

import PageContainer from "../../components/layout/PageContainer";

import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import Field from "../../components/ui/Field";
import Input from "../../components/ui/Input";
import ListCard from "../../components/ui/ListCard";
import MetricCard from "../../components/ui/MetricCard";
import Textarea from "../../components/ui/Textarea";

import { Customer } from "../../../types/customer";
import { Equipment } from "../../../types/equipment";
import { RepairOrder } from "../../../types/repair-orders";

import {
  getCustomerById,
  updateCustomer,
} from "../../../services/customers";

import {
  getEquipment,
} from "../../../services/equipment";

import {
  getRepairOrdersByCustomer,
} from "../../../services/repair-orders";

import {
  formatDate,
} from "../../utils/format";

export default function CustomerDetailPage() {
  const params = useParams();

  const customerId = params.id as string;

  const [customer, setCustomer] =
    useState<Customer | null>(null);

  const [equipment, setEquipment] =
    useState<Equipment[]>([]);

  const [repairOrders, setRepairOrders] =
    useState<RepairOrder[]>([]);

  useEffect(() => {
    const foundCustomer =
      getCustomerById(customerId) || null;

    setCustomer(foundCustomer);

    if (!foundCustomer) {
      setEquipment([]);
      setRepairOrders([]);
      return;
    }

    setEquipment(
      getEquipment().filter(
        (item) =>
          item.customerId === foundCustomer.id ||
          item.customerName === foundCustomer.name
      )
    );

    setRepairOrders(
      getRepairOrdersByCustomer(
        foundCustomer.id,
        foundCustomer.name
      )
    );
  }, [customerId]);

  function handleFieldChange(
    field: keyof Customer,
    value: string
  ) {
    if (!customer) {
      return;
    }

    const updatedCustomer: Customer = {
      ...customer,
      [field]: value,
      updatedDate: new Date().toISOString(),
    };

    updateCustomer(updatedCustomer);
    setCustomer(updatedCustomer);
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
      equipmentCount: equipment.length,
      repairOrderCount: repairOrders.length,
      openRepairOrders: openRepairOrders.length,
      completedRepairOrders: completedRepairOrders.length,
    };
  }, [
    equipment,
    repairOrders,
  ]);

  if (!customer) {
    return (
      <PageContainer>
        <EmptyState
          title="Customer not found"
          message="This customer record could not be found."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-5xl font-bold text-black">
            {customer.name}
          </h1>

          <p className="text-black/70 mt-2 text-lg">
            Customer detail, equipment, and service history
          </p>
        </div>

        <Link
          href="/customers"
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
          Back to Customers
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Equipment"
          value={metrics.equipmentCount}
        />

        <MetricCard
          label="Repair Orders"
          value={metrics.repairOrderCount}
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
            Customer Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Customer Name">
              <Input
                value={customer.name || ""}
                onChange={(value) =>
                  handleFieldChange(
                    "name",
                    value
                  )
                }
                placeholder="Customer Name"
              />
            </Field>

            <Field label="Phone">
              <Input
                value={customer.phone || ""}
                onChange={(value) =>
                  handleFieldChange(
                    "phone",
                    value
                  )
                }
                placeholder="Phone Number"
              />
            </Field>

            <Field label="Email">
              <Input
                type="email"
                value={customer.email || ""}
                onChange={(value) =>
                  handleFieldChange(
                    "email",
                    value
                  )
                }
                placeholder="Email Address"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="Address">
              <Input
                value={customer.address || ""}
                onChange={(value) =>
                  handleFieldChange(
                    "address",
                    value
                  )
                }
                placeholder="Address"
              />
            </Field>

            <Field label="City">
              <Input
                value={customer.city || ""}
                onChange={(value) =>
                  handleFieldChange(
                    "city",
                    value
                  )
                }
                placeholder="City"
              />
            </Field>

            <Field label="State">
              <Input
                value={customer.state || ""}
                onChange={(value) =>
                  handleFieldChange(
                    "state",
                    value
                  )
                }
                placeholder="State"
              />
            </Field>

            <Field label="Zip Code">
              <Input
                value={customer.zipCode || ""}
                onChange={(value) =>
                  handleFieldChange(
                    "zipCode",
                    value
                  )
                }
                placeholder="Zip Code"
              />
            </Field>
          </div>

          <Field label="Notes">
            <Textarea
              value={customer.notes || ""}
              onChange={(value) =>
                handleFieldChange(
                  "notes",
                  value
                )
              }
              placeholder="Customer notes"
              rows={4}
            />
          </Field>
        </div>
      </Card>

      <Card className="text-black">
        <div className="space-y-5">
          <h2 className="text-3xl font-bold">
            Equipment
          </h2>

          <div className="space-y-4">
            {equipment.length === 0 && (
              <EmptyState
                title="No equipment found"
                message="Equipment assigned to this customer will appear here."
              />
            )}

            {equipment.map((equipmentItem) => (
              <Link
                key={equipmentItem.id}
                href={`/equipment/${equipmentItem.id}`}
              >
                <ListCard>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">
                      {equipmentItem.manufacturer || "Unknown Manufacturer"}{" "}
                      {equipmentItem.model || "Unknown Model"}
                    </div>

                    <div className="text-black/60">
                      Serial:{" "}
                      {equipmentItem.serialNumber || "No serial number"}
                    </div>

                    <div className="text-black/60">
                      Category:{" "}
                      {equipmentItem.category || "Uncategorized"}
                    </div>
                  </div>
                </ListCard>
              </Link>
            ))}
          </div>
        </div>
      </Card>

      <Card className="text-black">
        <div className="space-y-5">
          <h2 className="text-3xl font-bold">
            Repair Orders
          </h2>

          <div className="space-y-4">
            {repairOrders.length === 0 && (
              <EmptyState
                title="No repair orders found"
                message="Repair orders for this customer will appear here."
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
                        {repairOrder.equipmentName}
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