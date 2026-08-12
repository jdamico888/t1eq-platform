"use client";

import { useState }
from "react";

import Card from "../ui/Card";
import Button from "../ui/Button";

import {
  createPart,
} from "../../../services/parts";

type Props = {
  repairOrderRO: string;

  onClose: () => void;

  onPartAdded: () => void;
};

export default function AddPartModal({
  repairOrderRO,
  onClose,
  onPartAdded,
}: Props) {
  const [partNumber,
    setPartNumber] =
    useState("");

  const [description,
    setDescription] =
    useState("");

  const [quantity,
    setQuantity] =
    useState(1);

  const [cost,
    setCost] =
    useState(0);

  const [salePrice,
    setSalePrice] =
    useState(0);

  const [source,
    setSource] =
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
              Add Part
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

          <div className="grid grid-cols-2 gap-4">

            <div>

              <label className="font-medium">
                Part Number
              </label>

              <input
                value={partNumber}
                onChange={(e) =>
                  setPartNumber(
                    e.target.value
                  )
                }
                className="
                  w-full
                  border
                  rounded-xl
                  p-3
                  mt-2
                "
              />

            </div>

            <div>

              <label className="font-medium">
                Description
              </label>

              <input
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                className="
                  w-full
                  border
                  rounded-xl
                  p-3
                  mt-2
                "
              />

            </div>

            <div>

              <label className="font-medium">
                Quantity
              </label>

              <input
                type="number"
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    Number(
                      e.target.value
                    )
                  )
                }
                className="
                  w-full
                  border
                  rounded-xl
                  p-3
                  mt-2
                "
              />

            </div>

            <div>

              <label className="font-medium">
                Cost
              </label>

              <input
                type="number"
                value={cost}
                onChange={(e) =>
                  setCost(
                    Number(
                      e.target.value
                    )
                  )
                }
                className="
                  w-full
                  border
                  rounded-xl
                  p-3
                  mt-2
                "
              />

            </div>

            <div>

              <label className="font-medium">
                Sale Price
              </label>

              <input
                type="number"
                value={salePrice}
                onChange={(e) =>
                  setSalePrice(
                    Number(
                      e.target.value
                    )
                  )
                }
                className="
                  w-full
                  border
                  rounded-xl
                  p-3
                  mt-2
                "
              />

            </div>

            <div>

              <label className="font-medium">
                Source
              </label>

              <input
                value={source}
                onChange={(e) =>
                  setSource(
                    e.target.value
                  )
                }
                className="
                  w-full
                  border
                  rounded-xl
                  p-3
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

                createPart({
                  id:
                    "PART-" +
                    Math.floor(
                      Math.random() *
                      100000
                    ),

                  repairOrderRO,

                  partNumber,

                  description,

                  quantity,

                  cost,

                  salePrice,

                  source,
                });

                onPartAdded();

                onClose();
              }}
            >
              Add Part
            </Button>

          </div>

        </div>

      </Card>

    </div>
  );
}