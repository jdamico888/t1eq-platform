# Repair Order Workflow

## Workflow Sequence

Appointment
→ Create Repair Order
→ Assign Technician
→ Add Repair Items
→ Add Photos
→ Execute Inspection
→ Generate Inspection PDF
→ Ready For Billing
→ Invoice Generated
→ Payment Received
→ Closed

---

## RO States

- Open
- In Progress
- Waiting On Estimate
- Waiting On Approval
- Waiting On Parts
- Ready For Billing
- Closed

---

## Core Relationships

Repair Orders connect to:

- Customers
- Sites
- Equipment
- Repair Items
- Inspections
- Photos
- PDFs
- Inventory Transactions
- Events
- To Dos

---

## Mobile Workflow

Technicians should be able to:

- Open assigned ROs
- Add repair actions
- Add photos
- Execute inspections
- Update statuses
- View equipment history
- Access manuals and FSBs

---

## Dashboard Integration

Dashboard should display:

- Open ROs
- Waiting On Parts
- Waiting On Billing
- Unpaid
- Inspections Due
- Technician Assignments
