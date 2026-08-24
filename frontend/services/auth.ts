import type { TechnicianProfile } from "@/types/technician-profile";
import type { PermissionFunctionKey } from "@/types/role-permissions";

import {
  getActiveTechnicianProfiles,
  getTechnicianProfileById,
} from "@/services/technician-profiles";

import {
  getRolePermissionsSettings,
  hasPermission,
} from "@/services/role-permissions";

export const AUTH_SESSION_UPDATED_EVENT = "t1eq-auth-session-updated";

const SESSION_STORAGE_KEY = "t1eq-current-session-technician-id";

/**
 * True when there is nobody an admin has set up yet to log in as. The login
 * gate is skipped in this state so a brand-new install never locks itself
 * out before the first employee record exists.
 */
export function loginRequiresSetup(): boolean {
  return getActiveTechnicianProfiles().length === 0;
}

export function getCurrentSessionTechnicianId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(SESSION_STORAGE_KEY);
}

export function getCurrentSessionTechnician(): TechnicianProfile | null {
  const technicianId = getCurrentSessionTechnicianId();

  if (!technicianId) {
    return null;
  }

  const technicianProfile = getTechnicianProfileById(technicianId);

  if (
    !technicianProfile ||
    !technicianProfile.active ||
    technicianProfile.status !== "Active"
  ) {
    return null;
  }

  return technicianProfile;
}

export function setCurrentSessionTechnicianId(technicianId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(SESSION_STORAGE_KEY, technicianId);

  window.dispatchEvent(new CustomEvent(AUTH_SESSION_UPDATED_EVENT));
}

export function clearCurrentSessionTechnician(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(SESSION_STORAGE_KEY);

  window.dispatchEvent(new CustomEvent(AUTH_SESSION_UPDATED_EVENT));
}

/**
 * Whether the person currently logged in is allowed to use a given app
 * function, resolved through the Role assigned on their employee record.
 *
 * Before any employee exists (see loginRequiresSetup) nothing is gating
 * anything yet, so this returns true — otherwise a fresh install would be
 * unable to use the very screens needed to set up the first user.
 *
 * Note this is a UI convenience gate only, not enforcement. Everything
 * still lives in this browser's localStorage and a determined user can
 * edit it directly. Real enforcement arrives with the backend.
 */
export function currentUserHasPermission(
  functionKey: PermissionFunctionKey
): boolean {
  if (loginRequiresSetup()) {
    return true;
  }

  const currentTechnician = getCurrentSessionTechnician();

  if (!currentTechnician) {
    return false;
  }

  return hasPermission(
    getRolePermissionsSettings(),
    currentTechnician.permissionRoleId,
    functionKey
  );
}

/**
 * A PIN check against plain-text local storage — a convenience gate, not
 * real security. A technician with no PIN set can log in with any (or no)
 * PIN entered.
 */
export function verifyTechnicianPin(
  technicianProfile: TechnicianProfile,
  enteredPin: string
): boolean {
  if (!technicianProfile.pin || !technicianProfile.pin.trim()) {
    return true;
  }

  return technicianProfile.pin.trim() === enteredPin.trim();
}
