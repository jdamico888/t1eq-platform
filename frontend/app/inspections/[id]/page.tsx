"use client";

import Link from "next/link";

import Card from "../../components/ui/Card";

import {
  getInspections,
} from "../../../services/inspections";

import {
  getEquipment,
} from "../../../services/equipment";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function InspectionPage({
  params,
}: Props) {
  const resolvedParams =
    await params;

  const inspection =
    getInspections().find(
      (inspection) =>
        inspection.id ===
        resolvedParams.id
    );

  if (!inspection) {
    return (
      <div className="text-red-600">
        Inspection Not Found
      </div>
    );
  }

  const equipment =
    getEquipment().find(
      (equipment) =>
        equipment.id ===
        inspection.equipmentId
    );

  return (
    <div className="space-y-6">

      <div>

        <h1 className="text-2xl font-bold">
          {inspection.id}
        </h1>

        <p className="text-gray-500 mt-2">
          ESA Compliance Inspection
        </p>

      </div>

      <Card>

        <div className="space-y-3">

          <p>
            <strong>Inspector:</strong>
            {" "}
            {inspection.inspector}
          </p>

          <p>
            <strong>Inspection Type:</strong>
            {" "}
            {inspection.inspectionType}
          </p>

          <p>
            <strong>Status:</strong>
            {" "}
            {inspection.status}
          </p>

          <p>
            <strong>
              Inspection Date:
            </strong>
            {" "}
            {inspection.inspectionDate}
          </p>

          <p>
            <strong>
              Inspection Due:
            </strong>
            {" "}
            {inspection.inspectionDue}
          </p>

          <p>
            <strong>Notes:</strong>
            {" "}
            {inspection.notes}
          </p>

          {equipment && (
            <p>
              <strong>Equipment:</strong>
              {" "}

              <Link
                href={`/equipment/${equipment.id}`}
                className="
                  text-blue-600
                  hover:underline
                "
              >
                {equipment.manufacturer}
                {" "}
                {equipment.model}
              </Link>
            </p>
          )}

        </div>

      </Card>

    </div>
  );
}