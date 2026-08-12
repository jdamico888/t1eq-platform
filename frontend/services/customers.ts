import { Customer } from "@/types/customer";
import {
  createId,
  createTimestamp,
  readStorageArray,
  writeStorageArray,
} from "@/lib/storage";

const STORAGE_KEY = "tier1_customers";

export type { Customer } from "@/types/customer";

export type CustomerInput = Omit<
  Customer,
  "id" | "createdDate" | "updatedDate"
>;

export function getCustomers(): Customer[] {
  return readStorageArray<Customer>(STORAGE_KEY);
}

export function saveCustomers(customers: Customer[]): void {
  writeStorageArray<Customer>(STORAGE_KEY, customers);
}

export function createCustomer(customer: CustomerInput): Customer {
  const existingCustomers = getCustomers();
  const timestamp = createTimestamp();

  const newCustomer: Customer = {
    id: createId(),
    ...customer,
    createdDate: timestamp,
    updatedDate: timestamp,
  };

  saveCustomers([...existingCustomers, newCustomer]);

  return newCustomer;
}

export function updateCustomer(
  idOrCustomer: string | Customer,
  updates?: Partial<CustomerInput>
): Customer | null {
  const customers = getCustomers();

  const id =
    typeof idOrCustomer === "string" ? idOrCustomer : idOrCustomer.id;

  const existingCustomer = customers.find((customer) => customer.id === id);

  if (!existingCustomer) return null;

  const updatePayload =
    typeof idOrCustomer === "string" ? updates || {} : idOrCustomer;

  const updatedCustomer: Customer = {
    ...existingCustomer,
    ...updatePayload,
    updatedDate: createTimestamp(),
  };

  saveCustomers(
    customers.map((customer) =>
      customer.id === id ? updatedCustomer : customer
    )
  );

  return updatedCustomer;
}

export function deleteCustomer(id: string): void {
  const customers = getCustomers();

  saveCustomers(customers.filter((customer) => customer.id !== id));
}

export function getCustomerById(id: string): Customer | undefined {
  return getCustomers().find((customer) => customer.id === id);
}

export function searchCustomers(searchTerm: string): Customer[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) return getCustomers();

  return getCustomers().filter((customer) => {
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
}