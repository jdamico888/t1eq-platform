"use client";

import type { ChangeEvent } from "react";

import type { RepairOrderSignature } from "@/types/repair-order";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(typeof reader.result === "string" ? reader.result : "");
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file."));
    };

    reader.readAsDataURL(file);
  });
}

export default function RepairOrderClockPrerequisitesPanel({
  modelSerialPhotoCaptured,
  modelSerialPhotoUrl,
  customerSignature,
  onModelSerialPhotoCapture,
  onCustomerSignatureCapture,
}: {
  modelSerialPhotoCaptured: boolean;
  modelSerialPhotoUrl?: string;
  customerSignature?: RepairOrderSignature;
  onModelSerialPhotoCapture: (imageUrl: string) => void;
  onCustomerSignatureCapture: (signature: RepairOrderSignature) => void;
}) {
  async function handleModelSerialPhotoUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    const imageUrl = await readFileAsDataUrl(file);

    if (!imageUrl) return;

    onModelSerialPhotoCapture(imageUrl);
    event.target.value = "";
  }

  function handleCustomerSignature() {
    const signerName = window.prompt("Customer signer name:");

    if (!signerName?.trim()) return;

    onCustomerSignatureCapture({
      signerName: signerName.trim(),
      signedDate: new Date().toISOString(),
    });
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-300">
          Clock Prerequisites
        </p>

        <h2 className="mt-2 text-2xl font-bold text-white">
          Model / Serial Photo + Customer Signature
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">
          These records feed the employee clock rules. A flat-rate employee can
          be blocked from clocking in until the model/serial photo is captured,
          and blocked from clocking out until the customer signature is captured.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-white">
                Model / Serial Photo
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/60">
                Required when the employee clock-in rule is set to model/serial
                picture.
              </p>
            </div>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-black ${
                modelSerialPhotoCaptured
                  ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-100"
                  : "border-orange-400/30 bg-orange-500/20 text-orange-100"
              }`}
            >
              {modelSerialPhotoCaptured ? "Captured" : "Missing"}
            </span>
          </div>

          {modelSerialPhotoUrl && (
            <img
              src={modelSerialPhotoUrl}
              alt="Model and serial tag"
              className="mt-4 max-h-56 w-full rounded-2xl border border-white/10 object-contain"
            />
          )}

          <label className="mt-5 inline-flex cursor-pointer rounded-xl border border-blue-400/30 bg-blue-500/20 px-4 py-2 text-sm font-black text-blue-100 transition hover:bg-blue-500/30">
            Upload Model / Serial Photo
            <input
              type="file"
              accept="image/*"
              onChange={handleModelSerialPhotoUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-white">
                Customer Signature
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/60">
                Required when the employee clock-out rule is set to customer
                signature.
              </p>
            </div>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-black ${
                customerSignature
                  ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-100"
                  : "border-orange-400/30 bg-orange-500/20 text-orange-100"
              }`}
            >
              {customerSignature ? "Captured" : "Missing"}
            </span>
          </div>

          {customerSignature && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                Signer
              </p>
              <p className="mt-1 text-sm font-bold text-white">
                {customerSignature.signerName}
              </p>

              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                Signed Date
              </p>
              <p className="mt-1 text-sm font-bold text-white">
                {new Date(customerSignature.signedDate).toLocaleString()}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleCustomerSignature}
            className="mt-5 rounded-xl border border-blue-400/30 bg-blue-500/20 px-4 py-2 text-sm font-black text-blue-100 transition hover:bg-blue-500/30"
          >
            Capture Customer Signature
          </button>
        </div>
      </div>
    </section>
  );
}