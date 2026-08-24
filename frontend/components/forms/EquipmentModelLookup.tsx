"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Typeahead, { type TypeaheadOption } from "./Typeahead";
import Modal from "@/app/components/ui/Modal";

import {
  createEquipmentModel,
  getEquipmentModels,
  findEquipmentModelByExactName,
  updateEquipmentModel,
  type EquipmentModel,
} from "@/services/equipment-models";

import {
  createEquipment,
  getEquipment,
  type Equipment,
} from "@/services/equipment";

export type EquipmentLookupValues = {
  model: string;
  serialNumber: string;
};

export const emptyEquipmentLookupValues: EquipmentLookupValues = {
  model: "",
  serialNumber: "",
};

/**
 * Resolves the customer equipment record this action item / line should
 * attach to. Reuses an existing instance for this customer if the same
 * model + serial number is already on file, otherwise creates a new one.
 * Category/manufacturer are pulled from the linked catalog model when
 * available since this step only captures Model and Serial Number.
 */
export function resolveEquipmentLookupRecord(
  value: EquipmentLookupValues,
  matchedModelId: string | null,
  customer: { id?: string; name: string },
  site?: { id?: string; name?: string }
): Equipment {
  const model = value.model.trim();
  const serialNumber = value.serialNumber.trim();

  const existingInstance = getEquipment().find((item) => {
    return (
      item.customerId === customer.id &&
      (item.model ?? "").trim().toLowerCase() === model.toLowerCase() &&
      (item.serialNumber ?? "").trim().toLowerCase() ===
        serialNumber.toLowerCase()
    );
  });

  if (existingInstance) {
    return existingInstance;
  }

  const catalogModel = matchedModelId
    ? getEquipmentModels().find((item) => item.id === matchedModelId)
    : undefined;

  return createEquipment({
    customerId: customer.id ?? "",
    customerName: customer.name,

    siteId: site?.id,
    siteName: site?.name,

    category: catalogModel?.category ?? "",
    manufacturer: catalogModel?.manufacturer ?? "",
    model,
    serialNumber,

    equipmentModelId: matchedModelId ?? undefined,

    status: "Active",
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read file."));
    };

    reader.onerror = () => {
      reject(new Error("Unable to read file."));
    };

    reader.readAsDataURL(file);
  });
}

type EquipmentModelLookupProps = {
  value: EquipmentLookupValues;
  onChange: (value: EquipmentLookupValues) => void;

  matchedModelId: string | null;
  onMatchedModelIdChange: (id: string | null) => void;

  qbitId?: string;
  qbitScope?: string;

  theme?: "light" | "dark";
};

export default function EquipmentModelLookup({
  value,
  onChange,
  matchedModelId,
  onMatchedModelIdChange,
  qbitId,
  qbitScope = "global",
  theme = "light",
}: EquipmentModelLookupProps) {
  const [equipmentModels, setEquipmentModels] = useState<EquipmentModel[]>([]);
  const [isAddModelModalOpen, setIsAddModelModalOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const lastPromptedValueRef = useRef<string>("");

  function loadEquipmentModels() {
    setEquipmentModels(getEquipmentModels());
  }

  useEffect(() => {
    loadEquipmentModels();
  }, []);

  const modelOptions: TypeaheadOption<EquipmentModel>[] = useMemo(() => {
    return equipmentModels.map((equipmentModel) => ({
      id: equipmentModel.id,
      label: equipmentModel.model,
      sublabel: [equipmentModel.manufacturer, equipmentModel.category]
        .filter(Boolean)
        .join(" · "),
      data: equipmentModel,
    }));
  }, [equipmentModels]);

  const matchedModel = matchedModelId
    ? equipmentModels.find((item) => item.id === matchedModelId)
    : undefined;

  useEffect(() => {
    setNotesDraft(matchedModel?.notes ?? "");
  }, [matchedModel?.id, matchedModel?.notes]);

  function handleModelTextChange(model: string) {
    onChange({ ...value, model });

    if (matchedModelId) {
      const stillMatches =
        findEquipmentModelByExactName(model)?.id === matchedModelId;

      if (!stillMatches) {
        onMatchedModelIdChange(null);
      }
    }
  }

  function handleModelSelected(option: TypeaheadOption<EquipmentModel>) {
    if (!option.data) {
      return;
    }

    onMatchedModelIdChange(option.data.id);
  }

  function handleModelBlur() {
    const model = value.model.trim();

    if (!model) {
      return;
    }

    if (matchedModelId) {
      return;
    }

    if (lastPromptedValueRef.current.toLowerCase() === model.toLowerCase()) {
      return;
    }

    const exactMatch = findEquipmentModelByExactName(model);

    if (exactMatch) {
      onMatchedModelIdChange(exactMatch.id);
      return;
    }

    lastPromptedValueRef.current = model;
    setIsAddModelModalOpen(true);
  }

  function handleModelCreated(newModel: EquipmentModel) {
    loadEquipmentModels();
    onMatchedModelIdChange(newModel.id);
    setIsAddModelModalOpen(false);
  }

  function handleUpdateNotes() {
    if (!matchedModelId) {
      return;
    }

    updateEquipmentModel(matchedModelId, { notes: notesDraft });
    loadEquipmentModels();
  }

  const hasManuals = Boolean(
    matchedModel?.repairManualUrl || matchedModel?.partsManualUrl
  );

  return (
    <div
      data-t1eq-qbit-type={qbitId ? "section" : undefined}
      data-t1eq-qbit-id={qbitId ? `${qbitId}-wrapper` : undefined}
      data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
      className="space-y-4"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Typeahead
            qbitId={qbitId ? `${qbitId}-model` : undefined}
            qbitScope={qbitScope}
            theme={theme}
            label="Equipment Model"
            placeholder="Start typing a model..."
            value={value.model}
            onChange={handleModelTextChange}
            onSelect={handleModelSelected}
            onBlur={handleModelBlur}
            options={modelOptions}
            noMatchHint="No matching model — you'll be prompted to add it once you finish typing."
            required
          />
        </div>

        <label className="block">
          <span
            className={
              theme === "dark"
                ? "text-xs font-semibold uppercase tracking-wide text-white/50"
                : "mb-1 block text-sm font-medium text-black"
            }
          >
            Serial Number
          </span>

          <input data-t1eq-field="true"
            data-t1eq-qbit-type="field"
            data-t1eq-qbit-id={qbitId ? `${qbitId}-serial` : undefined}
            data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
            value={value.serialNumber}
            onChange={(event) =>
              onChange({ ...value, serialNumber: event.target.value })
            }
            className={
              theme === "dark"
                ? "mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-400/60"
                : "mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-black outline-none transition focus:border-cyan-500"
            }
          />
        </label>
      </div>

      {!matchedModelId && value.model.trim() && (
        <button data-t1eq-action-button="true"
          data-t1eq-qbit-type="action-button"
          data-t1eq-qbit-id={qbitId ? `${qbitId}-add-model` : undefined}
          data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
          type="button"
          onClick={() => {
            lastPromptedValueRef.current = "";
            setIsAddModelModalOpen(true);
          }}
          className={
            theme === "dark"
              ? "rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
              : "rounded-xl border border-cyan-500/30 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
          }
        >
          Add "{value.model.trim()}" as a New Model
        </button>
      )}

      {matchedModel && (
        <div data-t1eq-tile="true" data-t1eq-page-card="true"
          data-t1eq-qbit-type="tile"
          data-t1eq-qbit-id={qbitId ? `${qbitId}-model-panel` : undefined}
          data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
          className={
            theme === "dark"
              ? "rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4"
              : "rounded-2xl border border-cyan-500/20 bg-cyan-50 p-4"
          }
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              className={
                theme === "dark"
                  ? "text-sm font-bold text-cyan-100"
                  : "text-sm font-bold text-cyan-800"
              }
            >
              {matchedModel.model}
              {matchedModel.manufacturer ? ` · ${matchedModel.manufacturer}` : ""}
            </div>

            {hasManuals && (
              <div className="flex flex-wrap gap-2">
                {matchedModel.repairManualUrl && (
                  <a
                    data-t1eq-qbit-type="action-button"
                    data-t1eq-qbit-id={
                      qbitId ? `${qbitId}-repair-manual-link` : undefined
                    }
                    data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
                    href={matchedModel.repairManualUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-current px-3 py-1 text-xs font-semibold"
                  >
                    Repair Manual
                  </a>
                )}

                {matchedModel.partsManualUrl && (
                  <a
                    data-t1eq-qbit-type="action-button"
                    data-t1eq-qbit-id={
                      qbitId ? `${qbitId}-parts-manual-link` : undefined
                    }
                    data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
                    href={matchedModel.partsManualUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-current px-3 py-1 text-xs font-semibold"
                  >
                    Parts Manual
                  </a>
                )}
              </div>
            )}
          </div>

          <label className="mt-3 block">
            <span
              className={
                theme === "dark"
                  ? "text-xs font-semibold uppercase tracking-wide text-cyan-100/70"
                  : "text-xs font-semibold uppercase tracking-wide text-cyan-700/70"
              }
            >
              Equipment Notes (technicians)
            </span>

            <textarea data-t1eq-field="true"
              data-t1eq-qbit-type="field"
              data-t1eq-qbit-id={qbitId ? `${qbitId}-model-notes` : undefined}
              data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
              value={notesDraft}
              onChange={(event) => setNotesDraft(event.target.value)}
              rows={3}
              placeholder="Notes about this equipment model, shared across every repair order."
              className={
                theme === "dark"
                  ? "mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-400/60"
                  : "mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none transition focus:border-cyan-500"
              }
            />

            {notesDraft !== (matchedModel.notes ?? "") && (
              <button data-t1eq-action-button="true"
                data-t1eq-qbit-type="action-button"
                data-t1eq-qbit-id={qbitId ? `${qbitId}-save-model-notes` : undefined}
                data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
                type="button"
                onClick={handleUpdateNotes}
                className="mt-2 rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-black/80"
              >
                Save Notes
              </button>
            )}
          </label>
        </div>
      )}

      {isAddModelModalOpen && (
        <AddEquipmentModelModal
          modelName={value.model.trim()}
          qbitId={qbitId ? `${qbitId}-add-model-modal` : undefined}
          qbitScope={qbitScope}
          onClose={() => setIsAddModelModalOpen(false)}
          onCreated={handleModelCreated}
        />
      )}
    </div>
  );
}

type AddEquipmentModelModalProps = {
  modelName: string;
  qbitId?: string;
  qbitScope?: string;
  onClose: () => void;
  onCreated: (newModel: EquipmentModel) => void;
};

function AddEquipmentModelModal({
  modelName,
  qbitId,
  qbitScope = "global",
  onClose,
  onCreated,
}: AddEquipmentModelModalProps) {
  const [manufacturer, setManufacturer] = useState("");
  const [category, setCategory] = useState("");
  const [pictureUrls, setPictureUrls] = useState<string[]>([]);
  const [repairManualUrl, setRepairManualUrl] = useState<string>();
  const [repairManualName, setRepairManualName] = useState<string>();
  const [partsManualUrl, setPartsManualUrl] = useState<string>();
  const [partsManualName, setPartsManualName] = useState<string>();
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handlePicturesSelected(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    const dataUrls = await Promise.all(files.map(readFileAsDataUrl));

    setPictureUrls((current) => [...current, ...dataUrls]);
    event.target.value = "";
  }

  async function handleRepairManualSelected(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setRepairManualUrl(await readFileAsDataUrl(file));
    setRepairManualName(file.name);
  }

  async function handlePartsManualSelected(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setPartsManualUrl(await readFileAsDataUrl(file));
    setPartsManualName(file.name);
  }

  function removePicture(index: number) {
    setPictureUrls((current) => current.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    if (!modelName) {
      return;
    }

    setIsSaving(true);

    const newModel = createEquipmentModel({
      model: modelName,
      manufacturer: manufacturer.trim() || undefined,
      category: category.trim() || undefined,
      pictureUrls,
      repairManualUrl,
      repairManualName,
      partsManualUrl,
      partsManualName,
      notes: notes.trim() || undefined,
    });

    setIsSaving(false);
    onCreated(newModel);
  }

  return (
    <Modal
      title={`Add New Model: ${modelName}`}
      onClose={onClose}
      qbitId={qbitId}
      qbitScope={qbitScope}
    >
      <div className="space-y-4">
        <p className="text-sm text-black/60">
          This model is not in the equipment catalog yet. Add pictures and
          manuals now, or skip and fill them in later from the Equipment
          page.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Manufacturer
            </span>
            <input data-t1eq-field="true"
              value={manufacturer}
              onChange={(event) => setManufacturer(event.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-black outline-none transition focus:border-cyan-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Category</span>
            <input data-t1eq-field="true"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-black outline-none transition focus:border-cyan-500"
            />
          </label>
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium">Pictures</span>

          <input data-t1eq-field="true"
            type="file"
            accept="image/*"
            multiple
            onChange={handlePicturesSelected}
            className="block w-full text-sm"
          />

          {pictureUrls.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {pictureUrls.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`${modelName} picture ${index + 1}`}
                    className="h-16 w-16 rounded-lg object-cover"
                  />

                  <button data-t1eq-action-button="true"
                    type="button"
                    onClick={() => removePicture(index)}
                    className="absolute -right-1 -top-1 rounded-full bg-black px-1.5 text-xs text-white"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Repair Manual
            </span>
            <input data-t1eq-field="true"
              type="file"
              onChange={handleRepairManualSelected}
              className="block w-full text-sm"
            />
            {repairManualName && (
              <p className="mt-1 text-xs text-black/50">{repairManualName}</p>
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Parts Manual
            </span>
            <input data-t1eq-field="true"
              type="file"
              onChange={handlePartsManualSelected}
              className="block w-full text-sm"
            />
            {partsManualName && (
              <p className="mt-1 text-xs text-black/50">{partsManualName}</p>
            )}
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Notes</span>
          <textarea data-t1eq-field="true"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Technician notes for this equipment model."
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-black outline-none transition focus:border-cyan-500"
          />
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <button data-t1eq-action-button="true"
            type="button"
            onClick={onClose}
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-100"
          >
            Skip For Now
          </button>

          <button data-t1eq-action-button="true"
            type="button"
            disabled={isSaving}
            onClick={handleSubmit}
            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/80 disabled:opacity-50"
          >
            Add Model
          </button>
        </div>
      </div>
    </Modal>
  );
}
