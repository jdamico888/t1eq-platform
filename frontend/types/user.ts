export type UserRole =
  | "Admin"
  | "Manager"
  | "Technician"
  | "Inspector"
  | "Parts"
  | "Accounting";

export type UserStatus =
  | "Active"
  | "Inactive";

export type User = {

  id: string;

  employeeId?: string;

  firstName: string;

  lastName: string;

  email?: string;

  phone?: string;

  role:
    UserRole;

  status:
    UserStatus;

  hourlyRate?: number;

  certifications?: string[];

  hireDate?: string;

  notes?: string;

  createdDate: string;

  updatedDate?: string;
};