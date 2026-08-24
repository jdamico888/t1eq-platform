"use client";

import { useEffect, useState } from "react";

import type { TechnicianProfile } from "@/types/technician-profile";

import { getActiveTechnicianProfiles } from "@/services/technician-profiles";
import { getRolePermissionsSettings } from "@/services/role-permissions";
import {
  setCurrentSessionTechnicianId,
  verifyTechnicianPin,
} from "@/services/auth";

const QBIT_SCOPE = "login-screen";

type LoginScreenProps = {
  onLoggedIn: () => void;
};

function getDisplayName(technicianProfile: TechnicianProfile) {
  const displayName = technicianProfile.displayName?.trim();

  if (displayName) {
    return displayName;
  }

  return `${technicianProfile.firstName} ${technicianProfile.lastName}`.trim();
}

export default function LoginScreen({ onLoggedIn }: LoginScreenProps) {
  const [technicianProfiles, setTechnicianProfiles] = useState<
    TechnicianProfile[]
  >([]);

  const [roleNameById, setRoleNameById] = useState<Record<string, string>>(
    {}
  );

  const [selectedTechnicianId, setSelectedTechnicianId] = useState<
    string | null
  >(null);

  const [pinInput, setPinInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setTechnicianProfiles(getActiveTechnicianProfiles());

    const roleSettings = getRolePermissionsSettings();
    const nextRoleNameById: Record<string, string> = {};

    roleSettings.roles.forEach((role) => {
      nextRoleNameById[role.id] = role.name;
    });

    setRoleNameById(nextRoleNameById);
  }, []);

  const selectedTechnician =
    technicianProfiles.find(
      (technicianProfile) => technicianProfile.id === selectedTechnicianId
    ) ?? null;

  function handleSelectTechnician(technicianProfile: TechnicianProfile) {
    setSelectedTechnicianId(technicianProfile.id);
    setPinInput("");
    setErrorMessage("");

    if (!technicianProfile.pin || !technicianProfile.pin.trim()) {
      setCurrentSessionTechnicianId(technicianProfile.id);
      onLoggedIn();
    }
  }

  function handleSubmitPin() {
    if (!selectedTechnician) {
      return;
    }

    if (!verifyTechnicianPin(selectedTechnician, pinInput)) {
      setErrorMessage("That PIN doesn't match. Try again.");
      return;
    }

    setCurrentSessionTechnicianId(selectedTechnician.id);
    onLoggedIn();
  }

  function handleBack() {
    setSelectedTechnicianId(null);
    setPinInput("");
    setErrorMessage("");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-6 text-black">
      <div data-t1eq-tile="true" data-t1eq-page-card="true"
        data-t1eq-qbit-type="page-card"
        data-t1eq-qbit-id="login-screen-card"
        data-t1eq-qbit-scope={QBIT_SCOPE}
        className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm"
      >
        <div className="text-center">
          <div className="text-sm font-black uppercase tracking-wide text-zinc-500">
            Tier One Equipment
          </div>

          <h1
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="login-screen-title"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="mt-2 text-3xl font-bold"
          >
            {selectedTechnician
              ? `Hi, ${selectedTechnician.firstName || getDisplayName(selectedTechnician)}`
              : "Who's working?"}
          </h1>

          <p
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="login-screen-subtitle"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="mt-2 text-sm text-black/60"
          >
            {selectedTechnician
              ? "Enter your PIN to continue."
              : "Select your name to log in."}
          </p>
        </div>

        {!selectedTechnician && (
          <div className="mt-6 space-y-2">
            {technicianProfiles.length === 0 && (
              <div data-t1eq-tile="true" data-t1eq-page-card="true"
                data-t1eq-qbit-type="page-card"
                data-t1eq-qbit-id="login-screen-empty"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-5 text-center text-sm text-black/50"
              >
                No active employees found. Add employees in Employee Setup
                first.
              </div>
            )}

            {technicianProfiles.map((technicianProfile) => (
              <button data-t1eq-action-button="true"
                key={technicianProfile.id}
                type="button"
                data-t1eq-qbit-type="action-button"
                data-t1eq-qbit-id={`login-screen-technician-${technicianProfile.id}`}
                data-t1eq-qbit-scope={QBIT_SCOPE}
                onClick={() => handleSelectTechnician(technicianProfile)}
                className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left transition hover:border-black hover:bg-white"
              >
                <span className="font-semibold">
                  {getDisplayName(technicianProfile)}
                </span>

                <span className="text-xs font-semibold uppercase tracking-wide text-black/50">
                  {(technicianProfile.permissionRoleId &&
                    roleNameById[technicianProfile.permissionRoleId]) ||
                    technicianProfile.role}
                </span>
              </button>
            ))}
          </div>
        )}

        {selectedTechnician && (
          <div className="mt-6 space-y-4">
            <input data-t1eq-field="true"
              data-t1eq-qbit-type="field"
              data-t1eq-qbit-id="login-screen-pin"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              type="password"
              inputMode="numeric"
              autoFocus
              value={pinInput}
              onChange={(event) => {
                setPinInput(event.target.value);
                setErrorMessage("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSubmitPin();
                }
              }}
              placeholder="PIN"
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-center text-lg tracking-[0.3em] outline-none focus:border-black focus:ring-2 focus:ring-black/10"
            />

            {errorMessage && (
              <div
                data-t1eq-qbit-type="text"
                data-t1eq-qbit-id="login-screen-error"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                className="text-center text-sm font-semibold text-red-600"
              >
                {errorMessage}
              </div>
            )}

            <div className="flex gap-3">
              <button data-t1eq-action-button="true"
                type="button"
                data-t1eq-qbit-type="action-button"
                data-t1eq-qbit-id="login-screen-back"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                onClick={handleBack}
                className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-100"
              >
                Back
              </button>

              <button data-t1eq-action-button="true"
                type="button"
                data-t1eq-qbit-type="action-button"
                data-t1eq-qbit-id="login-screen-submit"
                data-t1eq-qbit-scope={QBIT_SCOPE}
                onClick={handleSubmitPin}
                className="flex-1 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-black/80"
              >
                Log In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
