import { Organization }
from "../types/organization";

import {
  organization as seedOrganization,
} from "../data/organization";

const STORAGE_KEY =
  "organization";

export function getOrganization():
Organization {
  if (
    typeof window ===
    "undefined"
  ) {
    return seedOrganization;
  }

  const savedOrganization =
    localStorage.getItem(
      STORAGE_KEY
    );

  if (!savedOrganization) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        seedOrganization
      )
    );

    return seedOrganization;
  }

  return JSON.parse(
    savedOrganization
  );
}

export function saveOrganization(
  organization: Organization
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      organization
    )
  );
}