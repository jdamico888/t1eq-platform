"use client";

import { useEffect, useMemo, useState } from "react";

import CustomerSelector from "@/components/forms/CustomerSelector";
import EquipmentCategorySelector from "@/components/forms/EquipmentCategorySelector";
import FormActions from "@/components/forms/FormActions";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import ManufacturerSelector from "@/components/forms/ManufacturerSelector";
import SearchInput from "@/components/forms/SearchInput";
import SiteSelector from "@/components/forms/SiteSelector";

import FormCard from "@/components/layout/FormCard";
import ListPageLayout from "@/components/layout/ListPageLayout";
import TableCard from "@/components/layout/TableCard";
import TwoColumnLayout from "@/components/layout/TwoColumnLayout";

import EquipmentTable from "@/components/tables/EquipmentTable";

import { EQUIPMENT_STATUSES } from "@/constants/equipment";

import {
  createEquipment,
  deleteEquipment,
  getEquipment,
  updateEquipment,
  type Equipment,
  type EquipmentInput,
} from "@/services/equipment";

const QBIT_SCOPE = "equipment";

const emptyForm: EquipmentInput = {
  customerId: "",
  customerName: "",
  siteId: "",
  siteName: "",
  category: "",
  manufacturer: "",
  model: "",
  serialNumber: "",
  location: "",
  status: "Active",
  notes: "",
};

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  const [editingEquipmentId, setEditingEquipmentId] = useState<
    string | null
  >(null);

  const [search, setSearch] = useState("");

  const [formData, setFormData] =
    useState<EquipmentInput>(emptyForm);

  useEffect(() => {
    loadEquipment();
  }, []);

  function loadEquipment() {
    setEquipment(getEquipment());
  }

  function resetForm() {
    setFormData(emptyForm);
    setEditingEquipmentId(null);
  }

  function handleTextChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!formData.customerName.trim()) {
      alert("Customer is required.");
      return;
    }

    if (!formData.category.trim()) {
      alert("Equipment category is required.");
      return;
    }

    if (!formData.manufacturer.trim()) {
      alert("Manufacturer is required.");
      return;
    }

    if (editingEquipmentId) {
      updateEquipment(
        editingEquipmentId,
        formData
      );
    } else {
      createEquipment(formData);
    }

    loadEquipment();
    resetForm();
  }

  function handleEdit(item: Equipment) {
    setEditingEquipmentId(item.id);

    setFormData({
      customerId: item.customerId,
      customerName: item.customerName,

      siteId: item.siteId ?? "",
      siteName: item.siteName ?? "",

      category: item.category,
      manufacturer: item.manufacturer,

      model: item.model ?? "",
      serialNumber: item.serialNumber ?? "",
      location: item.location ?? "",

      status: item.status,

      notes: item.notes ?? "",
    });
  }

  function handleDelete(item: Equipment) {
    const confirmed = window.confirm(
      `Delete ${item.manufacturer} ${
        item.model || item.category
      }?`
    );

    if (!confirmed) {
      return;
    }

    deleteEquipment(item.id);

    loadEquipment();

    if (editingEquipmentId === item.id) {
      resetForm();
    }
  }

  const filteredEquipment = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    if (!normalizedSearch) {
      return equipment;
    }

    return equipment.filter((item) => {
      return (
        item.customerName
          .toLowerCase()
          .includes(normalizedSearch) ||
        Boolean(
          item.siteName
            ?.toLowerCase()
            .includes(normalizedSearch)
        ) ||
        item.category
          .toLowerCase()
          .includes(normalizedSearch) ||
        item.manufacturer
          .toLowerCase()
          .includes(normalizedSearch) ||
        Boolean(
          item.model
            ?.toLowerCase()
            .includes(normalizedSearch)
        ) ||
        Boolean(
          item.serialNumber
            ?.toLowerCase()
            .includes(normalizedSearch)
        ) ||
        Boolean(
          item.location
            ?.toLowerCase()
            .includes(normalizedSearch)
        ) ||
        item.status
          .toLowerCase()
          .includes(normalizedSearch)
      );
    });
  }, [equipment, search]);

  return (
    <ListPageLayout
      qbitId="equipment"
      qbitScope={QBIT_SCOPE}
      title="Equipment"
      description="Manage customer equipment assets, manufacturers, serial numbers, locations, and service status."
    >
      <TwoColumnLayout
        qbitId="equipment-workspace"
        qbitScope={QBIT_SCOPE}
        left={
          <FormCard
            qbitId="equipment-form"
            qbitScope={QBIT_SCOPE}
            title={
              editingEquipmentId
                ? "Edit Equipment"
                : "Add Equipment"
            }
            description="Register and maintain customer equipment records."
          >
            <form
              data-t1eq-qbit-type="section"
              data-t1eq-qbit-id="equipment-form-fields"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="space-y-4"
              onSubmit={handleSubmit}
            >
              <CustomerSelector
                qbitId="equipment-customer"
                qbitScope={QBIT_SCOPE}
                value={formData.customerName}
                onChange={(value) =>
                  setFormData((previous) => ({
                    ...previous,

                    customerName: value,

                    siteId: "",
                    siteName: "",
                  }))
                }
              />

              <SiteSelector
                qbitId="equipment-site"
                qbitScope={QBIT_SCOPE}
                value={formData.siteName ?? ""}
                customerName={formData.customerName}
                onChange={(value) =>
                  setFormData((previous) => ({
                    ...previous,
                    siteName: value,
                  }))
                }
              />

              <EquipmentCategorySelector
                qbitId="equipment-category"
                qbitScope={QBIT_SCOPE}
                value={formData.category}
                onChange={(value) =>
                  setFormData((previous) => ({
                    ...previous,
                    category: value,
                  }))
                }
              />

              <ManufacturerSelector
                qbitId="equipment-manufacturer"
                qbitScope={QBIT_SCOPE}
                value={formData.manufacturer}
                onChange={(value) =>
                  setFormData((previous) => ({
                    ...previous,
                    manufacturer: value,
                  }))
                }
              />

              <FormInput
                qbitId="equipment-model"
                qbitScope={QBIT_SCOPE}
                name="model"
                label="Model"
                value={formData.model ?? ""}
                onChange={handleTextChange}
              />

              <FormInput
                qbitId="equipment-serial-number"
                qbitScope={QBIT_SCOPE}
                name="serialNumber"
                label="Serial Number"
                value={formData.serialNumber ?? ""}
                onChange={handleTextChange}
              />

              <FormInput
                qbitId="equipment-location"
                qbitScope={QBIT_SCOPE}
                name="location"
                label="Location"
                value={formData.location ?? ""}
                onChange={handleTextChange}
              />

              <FormSelect
                qbitId="equipment-status"
                qbitScope={QBIT_SCOPE}
                name="status"
                label="Status"
                value={formData.status}
                options={EQUIPMENT_STATUSES.map((status) => ({
                  label: status,
                  value: status,
                }))}
                onChange={(event) =>
                  setFormData((previous) => ({
                    ...previous,
                    status:
                      event.target
                        .value as EquipmentInput["status"],
                  }))
                }
              />

              <FormTextarea
                qbitId="equipment-notes"
                qbitScope={QBIT_SCOPE}
                name="notes"
                label="Notes"
                value={formData.notes ?? ""}
                onChange={handleTextChange}
              />

              <FormActions
                qbitId="equipment-form"
                qbitScope={QBIT_SCOPE}
                isEditing={Boolean(
                  editingEquipmentId
                )}
                submitLabel="Save Equipment"
                updateLabel="Update Equipment"
                onCancel={resetForm}
              />
            </form>
          </FormCard>
        }
        right={
          <TableCard
            qbitId="equipment-registry"
            qbitScope={QBIT_SCOPE}
            title="Equipment Registry"
            description="Search and manage customer equipment assets."
            actions={
              <SearchInput
                qbitId="equipment-search"
                qbitScope={QBIT_SCOPE}
                value={search}
                onChange={setSearch}
                placeholder="Search equipment..."
              />
            }
          >
            <div
              data-t1eq-qbit-type="section"
              data-t1eq-qbit-id="equipment-table-container"
              data-t1eq-qbit-scope={QBIT_SCOPE}
            >
              <EquipmentTable
                equipment={filteredEquipment}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          </TableCard>
        }
      />
    </ListPageLayout>
  );
}