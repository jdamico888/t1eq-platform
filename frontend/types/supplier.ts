export type Supplier = {
  id: string;

  name: string;

  contactName?: string;
  phone?: string;
  email?: string;
  website?: string;

  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;

  accountNumber?: string;

  paymentTerms?: string;
  averageLeadTimeDays?: number;

  active?: boolean;

  notes?: string;

  createdDate: string;
  updatedDate?: string;
};