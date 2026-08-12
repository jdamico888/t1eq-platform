export type Site = {
  id: string;

  customerId: string;
  customerName: string;

  name: string;

  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;

  contactName?: string;
  phone?: string;
 email?: string;

  notes?: string;

  createdDate: string;
  updatedDate?: string;
};