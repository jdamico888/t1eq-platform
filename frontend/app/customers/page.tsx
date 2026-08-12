"use client";

import { useEffect, useMemo, useState } from "react";

import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import PhoneInput from "@/components/forms/PhoneInput";
import EmailInput from "@/components/forms/EmailInput";
import FormActions from "@/components/forms/FormActions";

import ListPageLayout from "@/components/layout/ListPageLayout";
import TwoColumnLayout from "@/components/layout/TwoColumnLayout";
import FormCard from "@/components/layout/FormCard";
import TableCard from "@/components/layout/TableCard";

import SearchInput from "@/components/forms/SearchInput";
import CustomerTable from "@/components/tables/CustomerTable";

import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  updateCustomer,
  type Customer,
  type CustomerInput,
} from "@/services/customers";

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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formData.name.trim()) {
      alert("Customer name is required.");
      return;
    }

    if (editingCustomerId) {
      updateCustomer(editingCustomerId, formData);
    } else {
      createCustomer(formData);
    }

    loadCustomers();
    resetForm();
  }

  function handleEdit(customer: Customer) {
    setEditingCustomerId(customer.id);

    setFormData({
      name: customer.name,
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      city: customer.city || "",
      state: customer.state || "",
      zipCode: customer.zipCode || "",
      notes: customer.notes || "",
    });
  }

  function handleDelete(customer: Customer) {
    const confirmed = window.confirm(`Delete ${customer.name}?`);

    if (!confirmed) return;

    deleteCustomer(customer.id);
    loadCustomers();

    if (editingCustomerId === customer.id) {
      resetForm();
    }
  }

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return customers;

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
      title="Customers"
      description="Manage customer records, contact information, addresses, notes, and service relationships."
    >
      <TwoColumnLayout
        left={
          <FormCard
            title={editingCustomerId ? "Edit Customer" : "Add Customer"}
            description="Customer profile and contact information."
          >
            <form className="space-y-4" onSubmit={handleSubmit}>
              <FormInput
                name="name"
                label="Customer Name"
                value={formData.name}
                onChange={handleTextChange}
                required
              />

              <PhoneInput
                label="Phone"
                value={formData.phone}
                onChange={(value) =>
                  setFormData((previous) => ({
                    ...previous,
                    phone: value,
                  }))
                }
              />

              <EmailInput
                label="Email"
                value={formData.email}
                onChange={(value) =>
                  setFormData((previous) => ({
                    ...previous,
                    email: value,
                  }))
                }
              />

              <FormInput
                name="address"
                label="Address"
                value={formData.address}
                onChange={handleTextChange}
              />

              <div className="grid gap-4 md:grid-cols-3">
                <FormInput
                  name="city"
                  label="City"
                  value={formData.city}
                  onChange={handleTextChange}
                />

                <FormInput
                  name="state"
                  label="State"
                  value={formData.state}
                  onChange={handleTextChange}
                />

                <FormInput
                  name="zipCode"
                  label="Zip"
                  value={formData.zipCode}
                  onChange={handleTextChange}
                />
              </div>

              <FormTextarea
                name="notes"
                label="Notes"
                value={formData.notes}
                onChange={handleTextChange}
              />

              <FormActions
                isEditing={Boolean(editingCustomerId)}
                submitLabel="Save Customer"
                updateLabel="Update Customer"
                onCancel={resetForm}
              />
            </form>
          </FormCard>
        }
        right={
          <TableCard
            title="Customer Directory"
            description="Search and manage all customer accounts."
            actions={
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search customers..."
              />
            }
          >
            <CustomerTable
              customers={filteredCustomers}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </TableCard>
        }
      />
    </ListPageLayout>
  );
}