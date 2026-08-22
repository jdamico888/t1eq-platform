"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import EmailInput from "@/components/forms/EmailInput";
import FormActions from "@/components/forms/FormActions";
import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import PhoneInput from "@/components/forms/PhoneInput";
import SearchInput from "@/components/forms/SearchInput";

import FormCard from "@/components/layout/FormCard";
import ListPageLayout from "@/components/layout/ListPageLayout";
import TableCard from "@/components/layout/TableCard";
import TwoColumnLayout from "@/components/layout/TwoColumnLayout";

import CustomerTable from "@/components/tables/CustomerTable";
import ActionButton from "@/components/ui/ActionButton";

import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  updateCustomer,
  type Customer,
  type CustomerInput,
} from "@/services/customers";

const QBIT_SCOPE = "customers";

const emptyForm: CustomerInput = {
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  notes: "",
};

export default function CustomersPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(
    null
  );

  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState<CustomerInput>(emptyForm);

  useEffect(() => {
    loadCustomers();
  }, []);

  function loadCustomers() {
    setCustomers(getCustomers());
  }

  function resetForm() {
    setFormData(emptyForm);
    setEditingCustomerId(null);
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

  function saveCustomer(): Customer | null {
    if (!formData.name.trim()) {
      alert("Customer name is required.");
      return null;
    }

    const savedCustomer = editingCustomerId
      ? updateCustomer(editingCustomerId, formData)
      : createCustomer(formData);

    loadCustomers();
    resetForm();

    return savedCustomer;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    saveCustomer();
  }

  function handleSaveAndCreateAppointment() {
    const savedCustomer = saveCustomer();

    if (!savedCustomer) {
      return;
    }

    const params = new URLSearchParams({
      customerId: savedCustomer.id,
      customerName: savedCustomer.name,
      openCreate: "1",
    });

    router.push(`/scheduling?${params.toString()}`);
  }

  function handleSaveAndCreateRO() {
    const savedCustomer = saveCustomer();

    if (!savedCustomer) {
      return;
    }

    const params = new URLSearchParams({
      customerId: savedCustomer.id,
      customerName: savedCustomer.name,
      openCreate: "1",
    });

    router.push(`/repair-orders?${params.toString()}`);
  }

  function handleEdit(customer: Customer) {
    setEditingCustomerId(customer.id);

    setFormData({
      name: customer.name,
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      address: customer.address ?? "",
      city: customer.city ?? "",
      state: customer.state ?? "",
      zipCode: customer.zipCode ?? "",
      notes: customer.notes ?? "",
    });
  }

  function handleDelete(customer: Customer) {
    const confirmed = window.confirm(`Delete ${customer.name}?`);

    if (!confirmed) {
      return;
    }

    deleteCustomer(customer.id);
    loadCustomers();

    if (editingCustomerId === customer.id) {
      resetForm();
    }
  }

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return customers;
    }

    return customers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(normalizedSearch) ||
        Boolean(customer.phone?.toLowerCase().includes(normalizedSearch)) ||
        Boolean(customer.email?.toLowerCase().includes(normalizedSearch)) ||
        Boolean(customer.address?.toLowerCase().includes(normalizedSearch)) ||
        Boolean(customer.city?.toLowerCase().includes(normalizedSearch)) ||
        Boolean(customer.state?.toLowerCase().includes(normalizedSearch)) ||
        Boolean(customer.zipCode?.toLowerCase().includes(normalizedSearch))
      );
    });
  }, [customers, search]);

  return (
    <ListPageLayout
      qbitId="customers"
      qbitScope={QBIT_SCOPE}
      title="Customers"
      description="Manage customer records, contact information, addresses, notes, and service relationships."
    >
      <TwoColumnLayout
        qbitId="customers-workspace"
        qbitScope={QBIT_SCOPE}
        left={
          <FormCard
            qbitId="customers-form"
            qbitScope={QBIT_SCOPE}
            title={editingCustomerId ? "Edit Customer" : "Add Customer"}
            description="Customer profile and contact information."
          >
            <form
              data-t1eq-qbit-type="section"
              data-t1eq-qbit-id="customers-form-fields"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="space-y-4"
              onSubmit={handleSubmit}
            >
              <FormInput
                qbitId="customer-name"
                qbitScope={QBIT_SCOPE}
                name="name"
                label="Customer Name"
                value={formData.name}
                onChange={handleTextChange}
                required
              />

              <PhoneInput
                qbitId="customer-phone"
                qbitScope={QBIT_SCOPE}
                label="Phone"
                value={formData.phone ?? ""}
                onChange={(value) =>
                  setFormData((previous) => ({
                    ...previous,
                    phone: value,
                  }))
                }
              />

              <EmailInput
                qbitId="customer-email"
                qbitScope={QBIT_SCOPE}
                label="Email"
                value={formData.email ?? ""}
                onChange={(value) =>
                  setFormData((previous) => ({
                    ...previous,
                    email: value,
                  }))
                }
              />

              <FormInput
                qbitId="customer-address"
                qbitScope={QBIT_SCOPE}
                name="address"
                label="Address"
                value={formData.address ?? ""}
                onChange={handleTextChange}
              />

              <div
                data-t1eq-qbit-type="section"
                data-t1eq-qbit-id="customer-location-fields"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="grid gap-4 md:grid-cols-3"
              >
                <FormInput
                  qbitId="customer-city"
                  qbitScope={QBIT_SCOPE}
                  name="city"
                  label="City"
                  value={formData.city ?? ""}
                  onChange={handleTextChange}
                />

                <FormInput
                  qbitId="customer-state"
                  qbitScope={QBIT_SCOPE}
                  name="state"
                  label="State"
                  value={formData.state ?? ""}
                  onChange={handleTextChange}
                />

                <FormInput
                  qbitId="customer-zip"
                  qbitScope={QBIT_SCOPE}
                  name="zipCode"
                  label="Zip"
                  value={formData.zipCode ?? ""}
                  onChange={handleTextChange}
                />
              </div>

              <FormTextarea
                qbitId="customer-notes"
                qbitScope={QBIT_SCOPE}
                name="notes"
                label="Notes"
                value={formData.notes ?? ""}
                onChange={handleTextChange}
              />

              <FormActions
                qbitId="customers-form"
                qbitScope={QBIT_SCOPE}
                isEditing={Boolean(editingCustomerId)}
                submitLabel="Save Customer"
                updateLabel="Update Customer"
                onCancel={resetForm}
                extraActions={
                  <>
                    <ActionButton
                      type="button"
                      variant="warning"
                      qbitId="customer-save-create-appointment"
                      qbitScope={QBIT_SCOPE}
                      onClick={handleSaveAndCreateAppointment}
                    >
                      Save/Create Appointment
                    </ActionButton>

                    <ActionButton
                      type="button"
                      variant="secondary"
                      qbitId="customer-save-create-ro"
                      qbitScope={QBIT_SCOPE}
                      onClick={handleSaveAndCreateRO}
                    >
                      Save/Create RO
                    </ActionButton>
                  </>
                }
              />
            </form>
          </FormCard>
        }
        right={
          <TableCard
            qbitId="customers-directory"
            qbitScope={QBIT_SCOPE}
            title="Customer Directory"
            description="Search and manage all customer accounts."
            actions={
              <SearchInput
                qbitId="customers-search"
                qbitScope={QBIT_SCOPE}
                value={search}
                onChange={setSearch}
                placeholder="Search customers..."
              />
            }
          >
            <div
              data-t1eq-qbit-type="section"
              data-t1eq-qbit-id="customers-table-container"
              data-t1eq-qbit-scope={QBIT_SCOPE}
            >
              <CustomerTable
                customers={filteredCustomers}
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