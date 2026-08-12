import { Part }
from "../types/part";

import {
  parts as seedParts,
} from "../data/parts";

const STORAGE_KEY =
  "parts";

export function getParts():
Part[] {
  if (
    typeof window ===
    "undefined"
  ) {
    return seedParts;
  }

  const savedParts =
    localStorage.getItem(
      STORAGE_KEY
    );

  if (!savedParts) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(seedParts)
    );

    return seedParts;
  }

  return JSON.parse(
    savedParts
  );
}

export function saveParts(
  parts: Part[]
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(parts)
  );
}

export function createPart(
  part: Part
) {
  const parts = getParts();

  parts.unshift(part);

  saveParts(parts);

  return parts;
}