"use client";

import { useEffect, useMemo, useState } from "react";

import CustomerSelector from "@/components/forms/CustomerSelector";
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

import SiteTable from "@/components/tables/SiteTable";

import {
  createSite,
  deleteSite,
  getSites,
  updateSite,
  type Site,
  type SiteInput,
} from "@/services/site";

const QBIT_SCOPE = "sites";

const emptyForm: SiteInput = {
  customerId: "",
  customerName: "",
  name: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  contactName: "",
  phone: "",
  email: "",
  notes: "",
};

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState<SiteInput>(emptyForm);

  useEffect(() => {
    loadSites();
  }, []);

  function loadSites() {
    setSites(getSites());
  }

  function resetForm() {
    setFormData(emptyForm);
    setEditingSiteId(null);
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

    if (!formData.customerName.trim()) {
      alert("Customer is required.");
      return;
    }

    if (!formData.name.trim()) {
      alert("Site name is required.");
      return;
    }

    if (editingSiteId) {
      updateSite(editingSiteId, formData);
    } else {
      createSite(formData);
    }

    loadSites();
    resetForm();
  }

  function handleEdit(site: Site) {
    setEditingSiteId(site.id);

    setFormData({
      customerId: site.customerId,
      customerName: site.customerName,
      name: site.name,

      address: site.address ?? "",
      city: site.city ?? "",
      state: site.state ?? "",
      zipCode: site.zipCode ?? "",

      contactName: site.contactName ?? "",
      phone: site.phone ?? "",
      email: site.email ?? "",

      notes: site.notes ?? "",
    });
  }

  function handleDelete(site: Site) {
    const confirmed = window.confirm(`Delete ${site.name}?`);

    if (!confirmed) {
      return;
    }

    deleteSite(site.id);
    loadSites();

    if (editingSiteId === site.id) {
      resetForm();
    }
  }

  const filteredSites = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return sites;
    }

    return sites.filter((site) => {
      return (
        site.customerName.toLowerCase().includes(normalizedSearch) ||
        site.name.toLowerCase().includes(normalizedSearch) ||
        Boolean(site.address?.toLowerCase().includes(normalizedSearch)) ||
        Boolean(site.city?.toLowerCase().includes(normalizedSearch)) ||
        Boolean(site.state?.toLowerCase().includes(normalizedSearch)) ||
        Boolean(site.zipCode?.toLowerCase().includes(normalizedSearch)) ||
        Boolean(site.contactName?.toLowerCase().includes(normalizedSearch)) ||
        Boolean(site.phone?.toLowerCase().includes(normalizedSearch)) ||
        Boolean(site.email?.toLowerCase().includes(normalizedSearch))
      );
    });
  }, [sites, search]);

  return (
    <ListPageLayout
      qbitId="sites"
      qbitScope={QBIT_SCOPE}
      title="Sites"
      description="Manage customer shop locations, service addresses, contacts, and site-specific records."
    >
      <TwoColumnLayout
        qbitId="sites-workspace"
        qbitScope={QBIT_SCOPE}
        left={
          <FormCard
            qbitId="sites-form"
            qbitScope={QBIT_SCOPE}
            title={editingSiteId ? "Edit Site" : "Add Site"}
            description="Create or update customer service locations."
          >
            <form
              data-t1eq-qbit-type="section"
              data-t1eq-qbit-id="sites-form-fields"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="space-y-4"
              onSubmit={handleSubmit}
            >
              <CustomerSelector
                qbitId="site-customer"
                qbitScope={QBIT_SCOPE}
                value={formData.customerName}
                onChange={(value) =>
                  setFormData((previous) => ({
                    ...previous,
                    customerName: value,
                  }))
                }
              />

              <FormInput
                qbitId="site-name"
                qbitScope={QBIT_SCOPE}
                name="name"
                label="Site Name"
                value={formData.name}
                onChange={handleTextChange}
                required
              />

              <FormInput
                qbitId="site-address"
                qbitScope={QBIT_SCOPE}
                name="address"
                label="Address"
                value={formData.address ?? ""}
                onChange={handleTextChange}
              />

              <div
                data-t1eq-qbit-type="section"
                data-t1eq-qbit-id="site-location-fields"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="grid gap-4 md:grid-cols-3"
              >
                <FormInput
                  qbitId="site-city"
                  qbitScope={QBIT_SCOPE}
                  name="city"
                  label="City"
                  value={formData.city ?? ""}
                  onChange={handleTextChange}
                />

                <FormInput
                  qbitId="site-state"
                  qbitScope={QBIT_SCOPE}
                  name="state"
                  label="State"
                  value={formData.state ?? ""}
                  onChange={handleTextChange}
                />

                <FormInput
                  qbitId="site-zip"
                  qbitScope={QBIT_SCOPE}
                  name="zipCode"
                  label="Zip"
                  value={formData.zipCode ?? ""}
                  onChange={handleTextChange}
                />
              </div>

              <FormInput
                qbitId="site-contact-name"
                qbitScope={QBIT_SCOPE}
                name="contactName"
                label="Contact Name"
                value={formData.contactName ?? ""}
                onChange={handleTextChange}
              />

              <PhoneInput
                qbitId="site-phone"
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
                qbitId="site-email"
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

              <FormTextarea
                qbitId="site-notes"
                qbitScope={QBIT_SCOPE}
                name="notes"
                label="Notes"
                value={formData.notes ?? ""}
                onChange={handleTextChange}
              />

              <FormActions
                qbitId="sites-form"
                qbitScope={QBIT_SCOPE}
                isEditing={Boolean(editingSiteId)}
                submitLabel="Save Site"
                updateLabel="Update Site"
                onCancel={resetForm}
              />
            </form>
          </FormCard>
        }
        right={
          <TableCard
            qbitId="sites-directory"
            qbitScope={QBIT_SCOPE}
            title="Site Directory"
            description="Search and manage customer service locations."
            actions={
              <SearchInput
                qbitId="sites-search"
                qbitScope={QBIT_SCOPE}
                value={search}
                onChange={setSearch}
                placeholder="Search sites..."
              />
            }
          >
            <div
              data-t1eq-qbit-type="section"
              data-t1eq-qbit-id="sites-table-container"
              data-t1eq-qbit-scope={QBIT_SCOPE}
            >
              <SiteTable
                sites={filteredSites}
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