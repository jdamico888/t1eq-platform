import { Site } from "@/types/site";
import {
  createId,
  createTimestamp,
  readStorageArray,
  writeStorageArray,
} from "@/lib/storage";

const STORAGE_KEY = "tier1_sites";

export type { Site } from "@/types/site";

export type SiteInput = Omit<Site, "id" | "createdDate" | "updatedDate">;

export function getSites(): Site[] {
  return readStorageArray<Site>(STORAGE_KEY);
}

export function saveSites(sites: Site[]): void {
  writeStorageArray<Site>(STORAGE_KEY, sites);
}

export function createSite(site: SiteInput): Site {
  const existingSites = getSites();
  const timestamp = createTimestamp();

  const newSite: Site = {
    id: createId(),
    ...site,
    createdDate: timestamp,
    updatedDate: timestamp,
  };

  saveSites([...existingSites, newSite]);

  return newSite;
}

export function updateSite(
  idOrSite: string | Site,
  updates?: Partial<SiteInput>
): Site | null {
  const sites = getSites();

  const id = typeof idOrSite === "string" ? idOrSite : idOrSite.id;

  const existingSite = sites.find((site) => site.id === id);

  if (!existingSite) return null;

  const updatePayload = typeof idOrSite === "string" ? updates || {} : idOrSite;

  const updatedSite: Site = {
    ...existingSite,
    ...updatePayload,
    updatedDate: createTimestamp(),
  };

  saveSites(sites.map((site) => (site.id === id ? updatedSite : site)));

  return updatedSite;
}

export function deleteSite(id: string): void {
  const sites = getSites();

  saveSites(sites.filter((site) => site.id !== id));
}

export function getSiteById(id: string): Site | undefined {
  return getSites().find((site) => site.id === id);
}

export function getSitesByCustomerId(customerId: string): Site[] {
  return getSites().filter((site) => site.customerId === customerId);
}

export function getSitesByCustomer(
  customerId: string,
  customerName?: string
): Site[] {
  return getSites().filter((site) => {
    return (
      site.customerId === customerId ||
      Boolean(customerName && site.customerName === customerName)
    );
  });
}

export function searchSites(searchTerm: string): Site[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) return getSites();

  return getSites().filter((site) => {
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
}