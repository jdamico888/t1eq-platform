"use client";

import { useEffect, useState } from "react";

import type { TechnicianProfile } from "@/types/technician-profile";

import { getRolePermissionsSettings } from "@/services/role-permissions";
import {
  AUTH_SESSION_UPDATED_EVENT,
  clearCurrentSessionTechnician,
  getCurrentSessionTechnician,
} from "@/services/auth";

const QBIT_SCOPE = "current-user-badge";

function getDisplayName(technicianProfile: TechnicianProfile) {
  const displayName = technicianProfile.displayName?.trim();

  if (displayName) {
    return displayName;
  }

  return `${technicianProfile.firstName} ${technicianProfile.lastName}`.trim();
}

export default function CurrentUserBadge() {
  const [currentTechnician, setCurrentTechnician] =
    useState<TechnicianProfile | null>(null);

  const [roleName, setRoleName] = useState<string | null>(null);

  function refresh() {
    const technicianProfile = getCurrentSessionTechnician();
    setCurrentTechnician(technicianProfile);

    if (technicianProfile?.permissionRoleId) {
      const roleSettings = getRolePermissionsSettings();

      const role = roleSettings.roles.find(
        (candidate) => candidate.id === technicianProfile.permissionRoleId
      );

      setRoleName(role?.name ?? null);
    } else {
      setRoleName(null);
    }
  }

  useEffect(() => {
    refresh();

    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, refresh);

    return () => {
      window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, refresh);
    };
  }, []);

  if (!currentTechnician) {
    return null;
  }

  return (
    <div data-t1eq-tile="true" data-t1eq-page-card="true"
      data-t1eq-qbit-type="tile"
      data-t1eq-qbit-id="current-user-badge"
      data-t1eq-qbit-scope={QBIT_SCOPE}
      className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3"
    >
      <div
        data-t1eq-qbit-type="text"
        data-t1eq-qbit-id="current-user-badge-label"
        data-t1eq-qbit-scope={QBIT_SCOPE}
        className="text-[10px] font-semibold uppercase tracking-wide text-white/40"
      >
        Logged in as
      </div>

      <div
        data-t1eq-qbit-type="text"
        data-t1eq-qbit-id="current-user-badge-name"
        data-t1eq-qbit-scope={QBIT_SCOPE}
        className="mt-1 text-sm font-bold text-white"
      >
        {getDisplayName(currentTechnician)}
      </div>

      {roleName && (
        <div
          data-t1eq-qbit-type="text"
          data-t1eq-qbit-id="current-user-badge-role"
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="text-xs text-white/50"
        >
          {roleName}
        </div>
      )}

      <button data-t1eq-action-button="true"
        type="button"
        data-t1eq-qbit-type="action-button"
        data-t1eq-qbit-id="current-user-badge-switch"
        data-t1eq-qbit-scope={QBIT_SCOPE}
        onClick={clearCurrentSessionTechnician}
        className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
      >
        Switch User
      </button>
    </div>
  );
}
