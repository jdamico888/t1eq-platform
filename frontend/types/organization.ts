export type Organization = {
  businessName: string;

  dba: string;

  address: string;

  city: string;

  state: string;

  zip: string;

  phone: string;

  email: string;

  website: string;

  logo?: string;

  defaultLaborRate: number;

  defaultTaxRate: number;

  invoiceTerms: string;
};