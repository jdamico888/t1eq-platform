export type TechnicianStatus =
  | "Active"
  | "Inactive"
  | "Vacation"
  | "Out Sick";

export type TechnicianCertification = {
  id: string;

  name: string;

  issuedDate?: string;
  expirationDate?: string;

  notes?: string;
};

export type Technician = {
  id: string;

  employeeId: string;

  firstName: string;
  lastName: string;

  email?: string;
  phone?: string;

  status: TechnicianStatus;

  laborRate?: number;

  certifications: TechnicianCertification[];

  notes?: string;

  createdDate: string;
  updatedDate?: string;
};