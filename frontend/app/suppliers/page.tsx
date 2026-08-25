"use client";

import { useEffect, useMemo, useState } from "react";

import PageContainer from "@/components/layout/PageContainer";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Field from "../components/ui/Field";
import Input from "../components/ui/Input";
import ListCard from "../components/ui/ListCard";
import MetricCard from "../components/ui/MetricCard";
import Select from "../components/ui/Select";
import StatusBadge from "../components/ui/StatusBadge";
import Textarea from "../components/ui/Textarea";

import {
  supplierStatusOptions,
} from "../constants/options";

import {
  Supplier,
} from "../../types/supplier";

import {
  createSupplier,
  getSuppliers,
  updateSupplier,
} from "../../services/suppliers";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] =
    useState<Supplier[]>([]);

  useEffect(() => {
    setSuppliers(getSuppliers());
  }, []);

  function handleCreateSupplier() {
    const newSupplier: Supplier = {
      id: crypto.randomUUID(),
      name: "New Supplier",
      contactName: "",
      phone: "",
      email: "",
      website: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "USA",
      accountNumber: "",
      paymentTerms: "Net 30",
      averageLeadTimeDays: 7,
      notes: "",
      active: true,
      createdDate: new Date().toISOString(),
    };

    createSupplier(newSupplier);

    setSuppliers([
      newSupplier,
      ...suppliers,
    ]);
  }

  function handleUpdateSupplier(
    updatedSupplier: Supplier
  ) {
    updateSupplier(updatedSupplier);

    setSuppliers(
      suppliers.map((supplier) =>
        supplier.id === updatedSupplier.id
          ? updatedSupplier
          : supplier
      )
    );
  }

  function handleFieldChange(
    supplierId: string,
    field: keyof Supplier,
    value: string | number | boolean
  ) {
    const supplier = suppliers.find(
      (item) => item.id === supplierId
    );

    if (!supplier) {
      return;
    }

    const updatedSupplier: Supplier = {
      ...supplier,
      [field]: value,
      updatedDate: new Date().toISOString(),
    };

    handleUpdateSupplier(updatedSupplier);
  }

  const metrics = useMemo(() => {
    const activeSuppliers = suppliers.filter(
      (supplier) => supplier.active
    );

    const inactiveSuppliers = suppliers.filter(
      (supplier) => !supplier.active
    );

    const suppliersWithAccounts = suppliers.filter(
      (supplier) =>
        (supplier.accountNumber || "").trim().length > 0
    );

    return {
      total: suppliers.length,
      active: activeSuppliers.length,
      inactive: inactiveSuppliers.length,
      accounts: suppliersWithAccounts.length,
    };
  }, [suppliers]);

  return (
    <PageContainer>
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-5xl font-bold text-black">
            Suppliers
          </h1>

          <p className="text-black/70 mt-2 text-lg">
            Vendor relationships, purchasing contacts, and supplier terms
          </p>
        </div>

        <Button onClick={handleCreateSupplier}>
          Add Supplier
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Suppliers"
          value={metrics.total}
        />

        <MetricCard
          label="Active"
          value={metrics.active}
        />

        <MetricCard
          label="Inactive"
          value={metrics.inactive}
        />

        <MetricCard
          label="Account Numbers"
          value={metrics.accounts}
        />
      </div>

      <Card className="text-black">
        <div className="space-y-5">
          <h2 className="text-3xl font-bold">
            Supplier Directory
          </h2>

          <div className="space-y-4">
            {suppliers.length === 0 && (
              <EmptyState
                title="No suppliers found"
                message="Add suppliers to track vendor contacts, account numbers, lead times, and purchasing terms."
              />
            )}

            {suppliers.map((supplier) => (
              <ListCard
                key={supplier.id}
                className="cursor-default"
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold">
                        {supplier.name}
                      </h3>

                      <div className="text-black/60">
                        {supplier.contactName || "No contact assigned"}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 min-w-40">
                      <StatusBadge
                        label={supplier.active ? "Active" : "Inactive"}
                        tone={
                          supplier.active
                            ? "success"
                            : "danger"
                        }
                      />

                      <Select
                        value={
                          supplier.active
                            ? "active"
                            : "inactive"
                        }
                        options={supplierStatusOptions}
                        onChange={(value) =>
                          handleFieldChange(
                            supplier.id,
                            "active",
                            value === "active"
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Supplier Name">
                      <Input
                        value={supplier.name}
                        onChange={(value) =>
                          handleFieldChange(
                            supplier.id,
                            "name",
                            value
                          )
                        }
                        placeholder="Supplier Name"
                      />
                    </Field>

                    <Field label="Contact Name">
                      <Input
                        value={supplier.contactName || ""}
                        onChange={(value) =>
                          handleFieldChange(
                            supplier.id,
                            "contactName",
                            value
                          )
                        }
                        placeholder="Contact Name"
                      />
                    </Field>

                    <Field label="Account Number">
                      <Input
                        value={supplier.accountNumber || ""}
                        onChange={(value) =>
                          handleFieldChange(
                            supplier.id,
                            "accountNumber",
                            value
                          )
                        }
                        placeholder="Account Number"
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Phone">
                      <Input
                        value={supplier.phone || ""}
                        onChange={(value) =>
                          handleFieldChange(
                            supplier.id,
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
                        value={supplier.email || ""}
                        onChange={(value) =>
                          handleFieldChange(
                            supplier.id,
                            "email",
                            value
                          )
                        }
                        placeholder="Email Address"
                      />
                    </Field>

                    <Field label="Website">
                      <Input
                        value={supplier.website || ""}
                        onChange={(value) =>
                          handleFieldChange(
                            supplier.id,
                            "website",
                            value
                          )
                        }
                        placeholder="Website"
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Field label="Address">
                      <Input
                        value={supplier.address || ""}
                        onChange={(value) =>
                          handleFieldChange(
                            supplier.id,
                            "address",
                            value
                          )
                        }
                        placeholder="Street Address"
                      />
                    </Field>

                    <Field label="City">
                      <Input
                        value={supplier.city || ""}
                        onChange={(value) =>
                          handleFieldChange(
                            supplier.id,
                            "city",
                            value
                          )
                        }
                        placeholder="City"
                      />
                    </Field>

                    <Field label="State">
                      <Input
                        value={supplier.state || ""}
                        onChange={(value) =>
                          handleFieldChange(
                            supplier.id,
                            "state",
                            value
                          )
                        }
                        placeholder="State"
                      />
                    </Field>

                    <Field label="Zip Code">
                      <Input
                        value={supplier.zipCode || ""}
                        onChange={(value) =>
                          handleFieldChange(
                            supplier.id,
                            "zipCode",
                            value
                          )
                        }
                        placeholder="Zip Code"
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Country">
                      <Input
                        value={supplier.country || ""}
                        onChange={(value) =>
                          handleFieldChange(
                            supplier.id,
                            "country",
                            value
                          )
                        }
                        placeholder="Country"
                      />
                    </Field>

                    <Field label="Payment Terms">
                      <Input
                        value={supplier.paymentTerms || ""}
                        onChange={(value) =>
                          handleFieldChange(
                            supplier.id,
                            "paymentTerms",
                            value
                          )
                        }
                        placeholder="Net 30"
                      />
                    </Field>

                    <Field label="Average Lead Time Days">
                      <Input
                        type="number"
                        value={supplier.averageLeadTimeDays || 0}
                        onChange={(value) =>
                          handleFieldChange(
                            supplier.id,
                            "averageLeadTimeDays",
                            Number(value)
                          )
                        }
                        placeholder="Lead Time Days"
                      />
                    </Field>
                  </div>

                  <Field label="Notes">
                    <Textarea
                      value={supplier.notes || ""}
                      onChange={(value) =>
                        handleFieldChange(
                          supplier.id,
                          "notes",
                          value
                        )
                      }
                      placeholder="Supplier notes"
                      rows={3}
                    />
                  </Field>
                </div>
              </ListCard>
            ))}
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}