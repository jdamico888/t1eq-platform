import {
  User,
  UserRole,
} from "../types/user";

const STORAGE_KEY = "t1eq-users";

export function getUsers(): User[] {
  if (typeof window === "undefined") {
    return [];
  }

  const savedUsers = localStorage.getItem(STORAGE_KEY);

  if (!savedUsers) {
    return [];
  }

  return JSON.parse(savedUsers);
}

export function saveUsers(users: User[]) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(users)
  );
}

export function createUser(user: User) {
  const users = getUsers();

  saveUsers([
    user,
    ...users,
  ]);
}

export function updateUser(updatedUser: User) {
  const users = getUsers();

  const updatedUsers = users.map((user) =>
    user.id === updatedUser.id
      ? updatedUser
      : user
  );

  saveUsers(updatedUsers);
}

export function deleteUser(userId: string) {
  const users = getUsers();

  const updatedUsers = users.filter(
    (user) => user.id !== userId
  );

  saveUsers(updatedUsers);
}

export function getUserById(userId: string) {
  const users = getUsers();

  return users.find(
    (user) => user.id === userId
  );
}

export function getUsersByRole(role: UserRole) {
  const users = getUsers();

  return users.filter(
    (user) => user.role === role
  );
}

export function getUserFullName(user: User) {
  return `${user.firstName} ${user.lastName}`.trim();
}