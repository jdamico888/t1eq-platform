"use client";

import { Fragment, useEffect, useMemo, useState } from "react";

import type {
  OperatingModel,
  PermissionFunctionKey,
  Role,
  RolePermissionsSettings,
} from "@/types/role-permissions";

import {
  OPERATING_MODELS,
  PERMISSION_FUNCTIONS,
  PERMISSION_FUNCTION_CATEGORIES,
} from "@/types/role-permissions";

import {
  addRole,
  applyOperatingModel,
  getRolePermissionsSettings,
  removeRole,
  renameRole,
  saveRolePermissionsSettings,
  toggleAllForRole,
  togglePermission,
} from "@/services/role-permissions";

const pageClass = "min-h-screen bg-zinc-100 p-6 text-black";
const headerClass =
  "mb-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm";
const sectionClass =
  "mb-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm";
const labelClass = "text-sm font-black uppercase tracking-wide text-zinc-500";
const smallLabelClass =
  "text-xs font-black uppercase tracking-wide text-zinc-500";
const inputClass =
  "w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base font-semibold text-black outline-none transition focus:border-black focus:ring-2 focus:ring-black/10";
const smallInputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-bold text-black outline-none transition focus:border-black focus:ring-2 focus:ring-black/10";
const primaryButtonClass =
  "rounded-xl bg-[var(--t1eq-sidebar-item-active-background-color)] px-5 py-3 text-sm font-black text-[var(--t1eq-sidebar-item-active-text-color)] shadow-sm transition hover:brightness-110";
const secondaryButtonClass =
  "rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-black text-zinc-700 shadow-sm transition hover:bg-zinc-50";
const dangerButtonClass =
  "rounded-full border border-red-300 bg-red-50 px-2 text-xs font-black text-red-700 shadow-sm transition hover:bg-red-100";

export default function RolesPermissionsPage() {
  const [settings, setSettings] = useState<RolePermissionsSettings>({
    roles: [],
    permissions: {},
    selectedModelId: null,
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [pendingModel, setPendingModel] = useState<OperatingModel | null>(null);
  const [pendingRemoveRoleId, setPendingRemoveRoleId] = useState<string | null>(
    null
  );
  const [newRoleName, setNewRoleName] = useState("");

  useEffect(() => {
    setSettings(getRolePermissionsSettings());
  }, []);

  const functionsByCategory = useMemo(() => {
    return PERMISSION_FUNCTION_CATEGORIES.map((category) => ({
      category,
      functions: PERMISSION_FUNCTIONS.filter(
        (permissionFunction) => permissionFunction.category === category
      ),
    }));
  }, []);

  function updateSettings(nextSettings: RolePermissionsSettings) {
    setSettings(nextSettings);
    setStatusMessage("");
  }

  function handleUseModel(model: OperatingModel) {
    if (settings.roles.length > 0 && settings.selectedModelId !== model.id) {
      setPendingModel(model);
      return;
    }

    updateSettings(applyOperatingModel(model.id));
  }

  function confirmUseModel() {
    if (!pendingModel) return;

    updateSettings(applyOperatingModel(pendingModel.id));
    setPendingModel(null);
  }

  function handleAddRole() {
    if (!newRoleName.trim()) return;

    updateSettings(addRole(settings, newRoleName));
    setNewRoleName("");
  }

  function handleRenameRole(roleId: string, name: string) {
    updateSettings(renameRole(settings, roleId, name));
  }

  function handleRequestRemoveRole(roleId: string) {
    setPendingRemoveRoleId(roleId);
  }

  function confirmRemoveRole() {
    if (!pendingRemoveRoleId) return;

    updateSettings(removeRole(settings, pendingRemoveRoleId));
    setPendingRemoveRoleId(null);
  }

  function handleToggleAllForRole(roleId: string) {
    updateSettings(toggleAllForRole(settings, roleId));
  }

  function handleTogglePermission(
    roleId: string,
    functionKey: PermissionFunctionKey
  ) {
    updateSettings(togglePermission(settings, roleId, functionKey));
  }

  function handleSave() {
    saveRolePermissionsSettings(settings);
    setStatusMessage("Roles & permissions saved.");
  }

  const pendingRemoveRole: Role | undefined = settings.roles.find(
    (role) => role.id === pendingRemoveRoleId
  );

  return (
    <div className={pageClass}>
      <div className="mx-auto max-w-6xl">
        <header className={headerClass}>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-zinc-400">
            Setup / Company
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">
            Roles &amp; Permissions
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-medium text-zinc-600">
            Decide who can see and do what. Every function in the app is a
            row below; every role your company defines is a column. Check a
            box to expose that control for that role, uncheck it to hide it —
            this is what drives what a technician, manager, or owner actually
            sees on screens like the Technician Workorder.
          </p>

          {statusMessage && (
            <div data-t1eq-tile="true" data-t1eq-page-card="true" className="mt-4 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
              {statusMessage}
            </div>
          )}
        </header>

        <section className={sectionClass}>
          <h2 className="text-lg font-black">Start From Your Company Structure</h2>
          <p className="mt-1 text-sm font-medium text-zinc-600">
            Pick the shape closest to how your company operates — it seeds a
            starting set of roles and permissions below, which you can rename
            or adjust however you like.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {OPERATING_MODELS.map((model) => {
              const inUse = settings.selectedModelId === model.id;

              return (
                <div data-t1eq-tile="true" data-t1eq-page-card="true"
                  key={model.id}
                  className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                >
                  <div className="text-sm font-black text-black">
                    {model.title}
                  </div>

                  <p className="flex-1 text-xs font-medium text-zinc-600">
                    {model.description}
                  </p>

                  <p className="text-[11px] font-black uppercase tracking-wide text-zinc-500">
                    Roles: {model.roles.map((role) => role.name).join(", ")}
                  </p>

                  <button data-t1eq-action-button="true"
                    type="button"
                    onClick={() => handleUseModel(model)}
                    className={inUse ? primaryButtonClass : secondaryButtonClass}
                  >
                    {inUse ? "✔ In Use" : "Use This Model"}
                  </button>
                </div>
              );
            })}
          </div>

          {pendingModel && (
            <div data-t1eq-tile="true" data-t1eq-page-card="true" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3">
              <p className="text-sm font-bold text-amber-900">
                Applying &quot;{pendingModel.title}&quot; will replace your
                current roles and permissions. Continue?
              </p>

              <div className="flex gap-2">
                <button data-t1eq-action-button="true"
                  type="button"
                  onClick={() => setPendingModel(null)}
                  className={secondaryButtonClass}
                >
                  Cancel
                </button>
                <button data-t1eq-action-button="true"
                  type="button"
                  onClick={confirmUseModel}
                  className={primaryButtonClass}
                >
                  Continue
                </button>
              </div>
            </div>
          )}
        </section>

        <section className={sectionClass}>
          <h2 className="text-lg font-black">Roles</h2>
          <p className="mt-1 text-sm font-medium text-zinc-600">
            These are the column headers in the grid below. Add as many as
            you need.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {settings.roles.map((role) => (
              <div data-t1eq-tile="true" data-t1eq-page-card="true"
                key={role.id}
                className="flex items-center gap-2 rounded-full border border-zinc-300 bg-zinc-50 py-1 pl-3 pr-1"
              >
                <input data-t1eq-field="true"
                  value={role.name}
                  onChange={(event) =>
                    handleRenameRole(role.id, event.target.value)
                  }
                  disabled={role.isLocked}
                  className="w-auto min-w-[3rem] max-w-[10rem] border-none bg-transparent text-sm font-bold text-black outline-none disabled:text-zinc-500"
                  style={{ width: `${Math.max(role.name.length, 4)}ch` }}
                />

                {role.isLocked ? (
                  <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-zinc-600">
                    🔒 Full Control
                  </span>
                ) : (
                  <button data-t1eq-action-button="true"
                    type="button"
                    onClick={() => handleRequestRemoveRole(role.id)}
                    title="Remove role"
                    className={dangerButtonClass}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            <div className="flex items-center gap-2">
              <input data-t1eq-field="true"
                type="text"
                value={newRoleName}
                onChange={(event) => setNewRoleName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleAddRole();
                  }
                }}
                placeholder="+ Add role…"
                className="rounded-full border border-dashed border-zinc-400 px-3 py-1.5 text-sm font-semibold outline-none"
              />
              <button data-t1eq-action-button="true"
                type="button"
                onClick={handleAddRole}
                className={secondaryButtonClass}
              >
                Add
              </button>
            </div>
          </div>

          {pendingRemoveRole && (
            <div data-t1eq-tile="true" data-t1eq-page-card="true" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-300 bg-red-50 px-4 py-3">
              <p className="text-sm font-bold text-red-900">
                Remove &quot;{pendingRemoveRole.name}&quot;? This deletes its
                entire permission column and can&apos;t be undone here.
              </p>

              <div className="flex gap-2">
                <button data-t1eq-action-button="true"
                  type="button"
                  onClick={() => setPendingRemoveRoleId(null)}
                  className={secondaryButtonClass}
                >
                  Cancel
                </button>
                <button data-t1eq-action-button="true"
                  type="button"
                  onClick={confirmRemoveRole}
                  className="rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-red-500"
                >
                  Remove Role
                </button>
              </div>
            </div>
          )}
        </section>

        <section className={sectionClass}>
          <h2 className="text-lg font-black">Function Access</h2>
          <p className="mt-1 text-sm font-medium text-zinc-600">
            Checked = this role sees the control and can use it. Unchecked =
            it&apos;s hidden from that role entirely.
          </p>

          <div data-t1eq-tile="true" data-t1eq-page-card="true" className="mt-5 overflow-x-auto rounded-2xl border border-zinc-200">
            {settings.roles.length === 0 ? (
              <div className="p-10 text-center text-sm font-semibold text-zinc-500">
                No roles yet — pick a starting model above, or add a role, to
                build the permission grid.
              </div>
            ) : (
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-white">
                    <th className="sticky left-0 min-w-[260px] bg-white p-3 text-left align-bottom">
                      <span className={smallLabelClass}>Function</span>
                    </th>

                    {settings.roles.map((role) => (
                      <th
                        key={role.id}
                        className="min-w-[150px] p-3 text-center align-bottom"
                      >
                        <div className="text-sm font-black text-black">
                          {role.name}
                        </div>
                        {!role.isLocked && (
                          <button data-t1eq-action-button="true"
                            type="button"
                            onClick={() => handleToggleAllForRole(role.id)}
                            className="mt-1 text-[11px] font-black text-zinc-500 underline underline-offset-2"
                          >
                            Select all / Clear all
                          </button>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {functionsByCategory.map(({ category, functions }) => (
                    <Fragment key={category}>
                      <tr className="bg-zinc-50">
                        <td
                          colSpan={settings.roles.length + 1}
                          className="p-2 pl-3 text-left text-[11px] font-black uppercase tracking-wide text-zinc-500"
                        >
                          {category}
                        </td>
                      </tr>

                      {functions.map((permissionFunction) => (
                        <tr
                          key={permissionFunction.key}
                          className="border-b border-zinc-100"
                        >
                          <td className="sticky left-0 min-w-[260px] bg-white p-3 align-middle">
                            <div className="text-sm font-bold text-black">
                              {permissionFunction.label}
                            </div>
                            <div className="mt-0.5 text-xs font-medium text-zinc-500">
                              {permissionFunction.description}
                            </div>
                          </td>

                          {settings.roles.map((role) => (
                            <td
                              key={role.id}
                              className="p-3 text-center align-middle"
                            >
                              <input data-t1eq-field="true"
                                type="checkbox"
                                checked={
                                  role.isLocked
                                    ? true
                                    : !!settings.permissions[role.id]?.[
                                        permissionFunction.key
                                      ]
                                }
                                disabled={role.isLocked}
                                onChange={() =>
                                  handleTogglePermission(
                                    role.id,
                                    permissionFunction.key
                                  )
                                }
                                className="h-4 w-4 accent-black disabled:opacity-60"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button data-t1eq-action-button="true" type="button" onClick={handleSave} className={primaryButtonClass}>
              Save Changes
            </button>
          </div>
        </section>

        <section data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-3xl border border-dashed border-zinc-300 bg-white p-5 text-xs font-medium text-zinc-500">
          This function list will keep growing as more screens get built
          (dispatch, inventory, invoicing, accounting, etc.) — it currently
          covers the functions introduced by the Technician Workorder screen
          plus job/payment basics, as a starting set.
        </section>
      </div>
    </div>
  );
}
