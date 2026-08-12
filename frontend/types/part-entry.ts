export type PartEntry = {

  id: string;

  actionItemId: string;

  partNumber: string;

  description: string;

  quantity: number;

  cost: number;

  price: number;

  total: number;

  supplier?: string;

  createdDate: string;

  updatedDate?: string;
};