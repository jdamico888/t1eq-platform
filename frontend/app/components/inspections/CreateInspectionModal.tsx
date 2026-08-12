"use client";

import { useState }
from "react";

import Card from "../ui/Card";
import Button from "../ui/Button";

import {
  createInspection,
} from "../../../services/inspections";

type Props = {
  equipmentId: string;

  onClose: () => void;

  onInspectionCreated: () => void;
};

export default function CreateInspectionModal({
  equipmentId,
  onClose,
  onInspectionCreated,
}: Props) {
  const [
    inspectionType,
    setInspectionType,
  ] = useState("");

  const [status, setStatus] =
    useState("Pass");

  const [notes, setNotes] =
    useState("");

  return (
    <div
      className="
        fixed
        inset-0
        bg-black/50
        flex
        items-center
        justify-center
        z-50
      "
    >
      <Card>

        <div className="w-[700px] space-y-6">

          <div className="flex justify-between items-center">

            <h2 className="text-2xl font-bold">
              New ESA Inspection
            </h2>

            <button
              onClick={onClose}
              className="
                text-gray-500
                hover:text-black
              "
            >
              ✕
            </button>

          </div>

          <div className="space-y-4">

            <div>

              <label className="text-sm font-medium">
                Inspection Type
              </label>

              <select
                value={inspectionType}
                onChange={(e) =>
                  setInspectionType(
                    e.target.value
                  )
                }
                className="
                  w-full
                  border
                  rounded-xl
                  px-4
                  py-3
                  mt-2
                "
              >
                <option value="">
                  Select Inspection Type
                </option>

                <option>
                  Annual Lift Inspection
                </option>

                <option>
                  Initial Certification
                </option>

                <option>
                  Follow-Up Inspection
                </option>

                <option>
                  Safety Audit
                </option>

              </select>

            </div>

            <div>

              <label className="text-sm font-medium">
                Status
              </label>

              <select
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value
                  )
                }
                className="
                  w-full
                  border
                  rounded-xl
                  px-4
                  py-3
                  mt-2
                "
              >
                <option>
                  Pass
                </option>

                <option>
                  Fail
                </option>

                <option>
                  Conditional
                </option>

              </select>

            </div>

            <div>

              <label className="text-sm font-medium">
                Notes
              </label>

              <textarea
                value={notes}
                onChange={(e) =>
                  setNotes(
                    e.target.value
                  )
                }
                rows={5}
                className="
                  w-full
                  border
                  rounded-xl
                  px-4
                  py-3
                  mt-2
                "
              />

            </div>

          </div>

          <div className="flex justify-end gap-3">

            <button
              onClick={onClose}
              className="
                px-5
                py-3
                border
                rounded-xl
              "
            >
              Cancel
            </button>

            <Button
              onClick={() => {

                createInspection({
                  id:
                    "INSP-" +
                    Math.floor(
                      Math.random() *
                      100000
                    ),

                  equipmentId,

                  inspector:
                    "Joe D'Amico",

                  inspectionType,

                  status:
                    status as
                    | "Pass"
                    | "Fail"
                    | "Conditional",

                  inspectionDate:
                    new Date()
                      .toISOString()
                      .split("T")[0],

                  inspectionDue:
                    "2027-05-01",

                  notes,
                });

                onInspectionCreated();

                onClose();
              }}
            >
              Create Inspection
            </Button>

          </div>

        </div>

      </Card>

    </div>
  );
}