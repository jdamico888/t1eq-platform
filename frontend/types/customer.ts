export type Customer = {
  id: string;

  name: string;

  phone?: string;

  email?: string;

  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;

  notes?: string;

  createdDate: string;
  updatedDate?: string;
};