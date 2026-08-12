"use client";

import { useEffect, useMemo, useState } from "react";

import PageContainer from "../components/layout/PageContainer";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Field from "../components/ui/Field";
import Input from "../components/ui/Input";
import ListCard from "../components/ui/ListCard";
import MetricCard from "../components/ui/MetricCard";
import Select from "../components/ui/Select";
import StatusBadge from "../components/ui/StatusBadge";
import Textarea from "../components/ui/Textarea";

import {
  userRoleOptions,
  userStatusOptions,
} from "../constants/options";

import {
  User,
  UserRole,
  UserStatus,
} from "../../types/user";

import {
  createUser,
  getUserFullName,
  getUsers,
  updateUser,
} from "../../services/users";

export default function UsersPage() {
  const [users, setUsers] =
    useState<User[]>([]);

  useEffect(() => {
    setUsers(getUsers());
  }, []);

  function handleCreateUser() {
    const newUser: User = {
      id: crypto.randomUUID(),
      employeeId: `EMP-${Date.now()}`,
      firstName: "New",
      lastName: "User",
      email: "",
      phone: "",
      role: "Technician",
      status: "Active",
      hourlyRate: 0,
      certifications: [],
      hireDate: new Date().toISOString(),
      notes: "",
      createdDate: new Date().toISOString(),
    };

    createUser(newUser);

    setUsers([
      newUser,
      ...users,
    ]);
  }

  function handleUpdateUser(
    updatedUser: User
  ) {
    updateUser(updatedUser);

    setUsers(
      users.map((user) =>
        user.id === updatedUser.id
          ? updatedUser
          : user
      )
    );
  }

  function handleFieldChange(
    userId: string,
    field: keyof User,
    value: string | number | string[]
  ) {
    const user = users.find(
      (item) => item.id === userId
    );

    if (!user) {
      return;
    }

    const updatedUser: User = {
      ...user,
      [field]: value,
      updatedDate: new Date().toISOString(),
    };

    handleUpdateUser(updatedUser);
  }

  const metrics = useMemo(() => {
    const activeUsers = users.filter(
      (user) => user.status === "Active"
    );

    const inactiveUsers = users.filter(
      (user) => user.status === "Inactive"
    );

    const technicians = users.filter(
      (user) => user.role === "Technician"
    );

    const inspectors = users.filter(
      (user) => user.role === "Inspector"
    );

    return {
      total: users.length,
      active: activeUsers.length,
      inactive: inactiveUsers.length,
      technicians: technicians.length,
      inspectors: inspectors.length,
    };
  }, [users]);

  return (
    <PageContainer>
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-5xl font-bold text-black">
            Workforce
          </h1>

          <p className="text-black/70 mt-2 text-lg">
            Technician and workforce management
          </p>
        </div>

        <Button onClick={handleCreateUser}>
          Add User
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard
          label="Total Users"
          value={metrics.total}
        />

        <MetricCard
          label="Active"
          value={metrics.active}
        />

        <MetricCard
          label="Inactive"
          value={metrics.inactive}
        />

        <MetricCard
          label="Technicians"
          value={metrics.technicians}
        />

        <MetricCard
          label="Inspectors"
          value={metrics.inspectors}
        />
      </div>

      <Card className="text-black">
        <div className="space-y-5">
          <h2 className="text-3xl font-bold">
            Workforce Directory
          </h2>

          <div className="space-y-4">
            {users.length === 0 && (
              <EmptyState
                title="No users found"
                message="Add users to track technicians, roles, labor rates, and workforce assignments."
              />
            )}

            {users.map((user) => (
              <ListCard
                key={user.id}
                className="cursor-default"
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold">
                        {getUserFullName(user)}
                      </h3>

                      <div className="text-black/60">
                        {user.employeeId || "No employee ID"}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 min-w-40">
                      <StatusBadge
                        label={user.status}
                        tone={
                          user.status === "Active"
                            ? "success"
                            : "danger"
                        }
                      />

                      <Select
                        value={user.status}
                        options={userStatusOptions}
                        onChange={(value) =>
                          handleFieldChange(
                            user.id,
                            "status",
                            value as UserStatus
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Field label="First Name">
                      <Input
                        value={user.firstName}
                        onChange={(value) =>
                          handleFieldChange(
                            user.id,
                            "firstName",
                            value
                          )
                        }
                        placeholder="First Name"
                      />
                    </Field>

                    <Field label="Last Name">
                      <Input
                        value={user.lastName}
                        onChange={(value) =>
                          handleFieldChange(
                            user.id,
                            "lastName",
                            value
                          )
                        }
                        placeholder="Last Name"
                      />
                    </Field>

                    <Field label="Employee ID">
                      <Input
                        value={user.employeeId || ""}
                        onChange={(value) =>
                          handleFieldChange(
                            user.id,
                            "employeeId",
                            value
                          )
                        }
                        placeholder="Employee ID"
                      />
                    </Field>

                    <Field label="Role">
                      <Select
                        value={user.role}
                        options={userRoleOptions}
                        onChange={(value) =>
                          handleFieldChange(
                            user.id,
                            "role",
                            value as UserRole
                          )
                        }
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Email">
                      <Input
                        type="email"
                        value={user.email || ""}
                        onChange={(value) =>
                          handleFieldChange(
                            user.id,
                            "email",
                            value
                          )
                        }
                        placeholder="Email Address"
                      />
                    </Field>

                    <Field label="Phone">
                      <Input
                        value={user.phone || ""}
                        onChange={(value) =>
                          handleFieldChange(
                            user.id,
                            "phone",
                            value
                          )
                        }
                        placeholder="Phone Number"
                      />
                    </Field>

                    <Field label="Hourly Rate">
                      <Input
                        type="number"
                        value={user.hourlyRate || 0}
                        onChange={(value) =>
                          handleFieldChange(
                            user.id,
                            "hourlyRate",
                            Number(value)
                          )
                        }
                        placeholder="Hourly Rate"
                      />
                    </Field>
                  </div>

                  <Field label="Certifications">
                    <Input
                      value={
                        user.certifications?.join(", ") ||
                        ""
                      }
                      onChange={(value) =>
                        handleFieldChange(
                          user.id,
                          "certifications",
                          value
                            .split(",")
                            .map((item) => item.trim())
                            .filter(Boolean)
                        )
                      }
                      placeholder="ASE Master, Lift Inspector, EPA 609"
                    />
                  </Field>

                  <Field label="Notes">
                    <Textarea
                      value={user.notes || ""}
                      onChange={(value) =>
                        handleFieldChange(
                          user.id,
                          "notes",
                          value
                        )
                      }
                      placeholder="Workforce notes"
                      rows={3}
                    />
                  </Field>
                </div>
              </ListCard>
            ))}
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}