import {
  OPERATING_MODELS,
  OperatingModel,
  OperatingModelId,
  PERMISSION_FUNCTION_KEYS,
  PermissionFunctionKey,
  Role,
  RolePermissions,
  RolePermissionsSettings,
  defaultRolePermissionsSettings,
} from "@/types/role-permissions";

export const ROLE_PERMISSIONS_UPDATED_EVENT = "t1eq-role-permissions-updated";

const STORAGE_KEY = "t1eq-role-permissions";

const DEFAULT_MODEL_ID: OperatingModelId = "ownerManagers";

function createRoleId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `role-${crypto.randomUUID()}`;
  }

  return `role-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function createEmptyPermissionMap(): Partial<Record<PermissionFunctionKey, boolean>> {
  const map: Partial<Record<PermissionFunctionKey, boolean>> = {};

  PERMISSION_FUNCTION_KEYS.forEach((key) => {
    map[key] = false;
  });

  return map;
}

export function buildSettingsFromModel(
  model: OperatingModel
): RolePermissionsSettings {
  const roles: Role[] = model.roles.map((seed) => ({
    id: createRoleId(),
    name: seed.name,
    isLocked: !!seed.locked,
  }));

  const permissions: RolePermissions = {};

  model.roles.forEach((seed, index) => {
    const roleId = roles[index].id;
    const map = createEmptyPermissionMap();

    PERMISSION_FUNCTION_KEYS.forEach((key) => {
      map[key] = seed.keys.includes(key);
    });

    permissions[roleId] = map;
  });

  return {
    roles,
    permissions,
    selectedModelId: model.id,
    updatedDate: new Date().toISOString(),
  };
}

function getOperatingModel(modelId: OperatingModelId): OperatingModel {
  const model = OPERATING_MODELS.find((item) => item.id === modelId);

  if (!model) {
    throw new Error(`Unknown operating model: ${modelId}`);
  }

  return model;
}

export function getRolePermissionsSettings(): RolePermissionsSettings {
  if (typeof window === "undefined") {
    return defaultRolePermissionsSettings;
  }

  const storedValue = localStorage.getItem(STORAGE_KEY);

  if (!storedValue) {
    const seededSettings = buildSettingsFromModel(getOperatingModel(DEFAULT_MODEL_ID));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(seededSettings));

    return seededSettings;
  }

  try {
    return JSON.parse(storedValue) as RolePermissionsSettings;
  } catch {
    return defaultRolePermissionsSettings;
  }
}

export function saveRolePermissionsSettings(
  settings: RolePermissionsSettings
) {
  const nextSettings: RolePermissionsSettings = {
    ...settings,
    updatedDate: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings));

  window.dispatchEvent(
    new CustomEvent(ROLE_PERMISSIONS_UPDATED_EVENT, { detail: nextSettings })
  );
}

export function applyOperatingModel(
  modelId: OperatingModelId
): RolePermissionsSettings {
  const settings = buildSettingsFromModel(getOperatingModel(modelId));

  saveRolePermissionsSettings(settings);

  return settings;
}

export function addRole(
  settings: RolePermissionsSettings,
  name: string
): RolePermissionsSettings {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return settings;
  }

  const id = createRoleId();
  const role: Role = { id, name: trimmedName };

  return {
    ...settings,
    roles: [...settings.roles, role],
    permissions: { ...settings.permissions, [id]: createEmptyPermissionMap() },
    selectedModelId: null,
  };
}

export function renameRole(
  settings: RolePermissionsSettings,
  roleId: string,
  name: string
): RolePermissionsSettings {
  return {
    ...settings,
    roles: settings.roles.map((role) =>
      role.id === roleId ? { ...role, name } : role
    ),
    selectedModelId: null,
  };
}

export function removeRole(
  settings: RolePermissionsSettings,
  roleId: string
): RolePermissionsSettings {
  const role = settings.roles.find((item) => item.id === roleId);

  if (!role || role.isLocked) {
    // Safety rail: never allow removing a locked full-control role.
    return settings;
  }

  const nextPermissions = { ...settings.permissions };
  delete nextPermissions[roleId];

  return {
    ...settings,
    roles: settings.roles.filter((item) => item.id !== roleId),
    permissions: nextPermissions,
    selectedModelId: null,
  };
}

export function togglePermission(
  settings: RolePermissionsSettings,
  roleId: string,
  functionKey: PermissionFunctionKey
): RolePermissionsSettings {
  const role = settings.roles.find((item) => item.id === roleId);

  if (!role || role.isLocked) {
    // Safety rail: a locked role always keeps full access.
    return settings;
  }

  const currentMap = settings.permissions[roleId] ?? createEmptyPermissionMap();

  const nextMap = {
    ...currentMap,
    [functionKey]: !currentMap[functionKey],
  };

  return {
    ...settings,
    permissions: { ...settings.permissions, [roleId]: nextMap },
    selectedModelId: null,
  };
}

export function toggleAllForRole(
  settings: RolePermissionsSettings,
  roleId: string
): RolePermissionsSettings {
  const role = settings.roles.find((item) => item.id === roleId);

  if (!role || role.isLocked) {
    return settings;
  }

  const currentMap = settings.permissions[roleId] ?? createEmptyPermissionMap();
  const allOn = PERMISSION_FUNCTION_KEYS.every((key) => !!currentMap[key]);

  const nextMap: Partial<Record<PermissionFunctionKey, boolean>> = {};

  PERMISSION_FUNCTION_KEYS.forEach((key) => {
    nextMap[key] = !allOn;
  });

  return {
    ...settings,
    permissions: { ...settings.permissions, [roleId]: nextMap },
    selectedModelId: null,
  };
}

export function hasPermission(
  settings: RolePermissionsSettings,
  roleId: string | null | undefined,
  functionKey: PermissionFunctionKey
): boolean {
  if (!roleId) {
    return false;
  }

  const role = settings.roles.find((item) => item.id === roleId);

  if (!role) {
    return false;
  }

  if (role.isLocked) {
    return true;
  }

  return !!settings.permissions[roleId]?.[functionKey];
}

export function getRoleByName(
  settings: RolePermissionsSettings,
  name: string
): Role | undefined {
  return settings.roles.find((role) => role.name === name);
}

export function getRoleById(
  settings: RolePermissionsSettings,
  roleId: string | null | undefined
): Role | undefined {
  if (!roleId) {
    return undefined;
  }

  return settings.roles.find((role) => role.id === roleId);
}
