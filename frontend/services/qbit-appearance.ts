import type { ThreeDEffectLevel } from "@/types/appearance-settings";

export type QBitElementType =
  | "tile"
  | "information-balloon"
  | "sidebar"
  | "sidebar-button"
  | "action-button"
  | "field"
  | "page-card"
  | "background"
  | "logo"
  | "text"
  | "section";

export type QBitDescriptor = {
  id: string;
  type: QBitElementType;
  scope: string;
};

export type QBitOverride = {
  id: string;
  type: QBitElementType;
  scope: string;

  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;

  width?: number;
  height?: number;

  offsetX?: number;
  offsetY?: number;

  borderRadius?: number;

  depth?: ThreeDEffectLevel;
};

type InlineStyleSnapshot = {
  value: string;
  priority: string;
};

const QBIT_OVERRIDE_STORAGE_KEY =
  "t1eq-qbit-overrides-v4";

const QBIT_SELECTOR =
  "[data-t1eq-qbit-id][data-t1eq-qbit-type]";

/*
 * Q-Bit remembers only the inline properties it owns.
 *
 * This prevents reset/cancel from deleting legitimate application
 * styles that existed before Q-Bit touched the element.
 */
const originalStyleSnapshots =
  new WeakMap<
    HTMLElement,
    Map<string, InlineStyleSnapshot>
  >();

function isQBitElementType(
  value: unknown
): value is QBitElementType {
  return (
    value === "tile" ||
    value === "information-balloon" ||
    value === "sidebar" ||
    value === "sidebar-button" ||
    value === "action-button" ||
    value === "field" ||
    value === "page-card" ||
    value === "background" ||
    value === "logo" ||
    value === "text" ||
    value === "section"
  );
}

function captureOriginalProperty(
  element: HTMLElement,
  property: string
): void {
  let propertyMap =
    originalStyleSnapshots.get(element);

  if (!propertyMap) {
    propertyMap =
      new Map<
        string,
        InlineStyleSnapshot
      >();

    originalStyleSnapshots.set(
      element,
      propertyMap
    );
  }

  if (propertyMap.has(property)) {
    return;
  }

  propertyMap.set(property, {
    value:
      element.style.getPropertyValue(
        property
      ),

    priority:
      element.style.getPropertyPriority(
        property
      ),
  });
}

function setQBitProperty(
  element: HTMLElement,
  property: string,
  value: string,
  priority = "important"
): void {
  captureOriginalProperty(
    element,
    property
  );

  element.style.setProperty(
    property,
    value,
    priority
  );
}

function restoreQBitProperty(
  element: HTMLElement,
  property: string
): void {
  const propertyMap =
    originalStyleSnapshots.get(element);

  const snapshot =
    propertyMap?.get(property);

  if (!snapshot) {
    /*
     * If Q-Bit does not own a snapshot for this property,
     * it must not erase the application's style.
     */
    return;
  }

  if (snapshot.value) {
    element.style.setProperty(
      property,
      snapshot.value,
      snapshot.priority
    );
  } else {
    element.style.removeProperty(
      property
    );
  }

  propertyMap?.delete(property);

  if (
    propertyMap &&
    propertyMap.size === 0
  ) {
    originalStyleSnapshots.delete(
      element
    );
  }
}

export function getQBitStorageKey() {
  return QBIT_OVERRIDE_STORAGE_KEY;
}

function safeReadOverrides(): QBitOverride[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedValue =
      localStorage.getItem(
        QBIT_OVERRIDE_STORAGE_KEY
      );

    if (!storedValue) {
      return [];
    }

    const parsedValue =
      JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(
      (value): value is QBitOverride => {
        if (
          !value ||
          typeof value !== "object" ||
          Array.isArray(value)
        ) {
          return false;
        }

        const record =
          value as Record<
            string,
            unknown
          >;

        return (
          typeof record.id ===
            "string" &&
          isQBitElementType(
            record.type
          ) &&
          typeof record.scope ===
            "string"
        );
      }
    );
  } catch {
    return [];
  }
}

export function getQBitOverrides(): QBitOverride[] {
  return safeReadOverrides();
}

export function saveQBitOverrides(
  overrides: QBitOverride[]
): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    QBIT_OVERRIDE_STORAGE_KEY,
    JSON.stringify(overrides)
  );

  window.dispatchEvent(
    new CustomEvent(
      "t1eq-qbit-overrides-changed"
    )
  );
}

export function getQBitDescriptor(
  element: HTMLElement
): QBitDescriptor | null {
  const id =
    element.dataset.t1eqQbitId?.trim();

  const rawType =
    element.dataset.t1eqQbitType?.trim();

  const scope =
    element.dataset.t1eqQbitScope?.trim() ||
    "global";

  if (
    !id ||
    !rawType ||
    !isQBitElementType(rawType)
  ) {
    return null;
  }

  return {
    id,
    type: rawType,
    scope,
  };
}

export function getQBitElement(
  descriptor: Pick<
    QBitDescriptor,
    "id" | "scope"
  >
): HTMLElement | null {
  if (typeof document === "undefined") {
    return null;
  }

  const elements =
    document.querySelectorAll<HTMLElement>(
      QBIT_SELECTOR
    );

  for (const element of elements) {
    const currentDescriptor =
      getQBitDescriptor(element);

    if (!currentDescriptor) {
      continue;
    }

    if (
      currentDescriptor.id ===
        descriptor.id &&
      currentDescriptor.scope ===
        descriptor.scope
    ) {
      return element;
    }
  }

  return null;
}

export function getQBitOverride(
  descriptor: Pick<
    QBitDescriptor,
    "id" | "scope"
  >
): QBitOverride | null {
  return (
    safeReadOverrides().find(
      (override) =>
        override.id ===
          descriptor.id &&
        override.scope ===
          descriptor.scope
    ) ?? null
  );
}

export function updateQBitOverride(
  descriptor: QBitDescriptor,
  updates: Partial<
    Omit<
      QBitOverride,
      "id" | "type" | "scope"
    >
  >
): QBitOverride {
  const overrides =
    safeReadOverrides();

  const existing =
    overrides.find(
      (override) =>
        override.id ===
          descriptor.id &&
        override.scope ===
          descriptor.scope
    ) ?? null;

  const nextOverride: QBitOverride = {
    ...(existing ?? {}),

    id: descriptor.id,
    type: descriptor.type,
    scope: descriptor.scope,

    ...updates,
  };

  const nextOverrides =
    existing
      ? overrides.map(
          (override) =>
            override.id ===
              descriptor.id &&
            override.scope ===
              descriptor.scope
              ? nextOverride
              : override
        )
      : [
          ...overrides,
          nextOverride,
        ];

  saveQBitOverrides(
    nextOverrides
  );

  return nextOverride;
}

export function removeQBitOverride(
  descriptor: Pick<
    QBitDescriptor,
    "id" | "scope"
  >
): void {
  const nextOverrides =
    safeReadOverrides().filter(
      (override) =>
        !(
          override.id ===
            descriptor.id &&
          override.scope ===
            descriptor.scope
        )
    );

  saveQBitOverrides(
    nextOverrides
  );
}

function getDepthTransform(
  depth?: ThreeDEffectLevel
): string {
  switch (depth) {
    case "Subtle":
      return "perspective(900px) rotateX(1deg) translateY(-2px) scale(1.005)";

    case "Medium":
      return "perspective(900px) rotateX(2.5deg) translateY(-5px) scale(1.018)";

    case "Strong":
      return "perspective(850px) rotateX(7deg) rotateY(-1deg) translateY(-14px) scale(1.055)";

    case "Off":
      return "none";

    default:
      return "";
  }
}

function getTextTargets(
  element: HTMLElement
): HTMLElement[] {
  return [
    element,
    ...Array.from(
      element.querySelectorAll<HTMLElement>(
        [
          "p",
          "span",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "a",
          "button",
          "strong",
          "small",
          "label",
        ].join(",")
      )
    ),
  ];
}

function applyTextColor(
  element: HTMLElement,
  textColor: string
): void {
  getTextTargets(
    element
  ).forEach((target) => {
    if (
      target.closest(
        "[data-t1eq-appearance-editor='true']"
      )
    ) {
      return;
    }

    setQBitProperty(
      target,
      "color",
      textColor
    );
  });
}

function restoreTextColor(
  element: HTMLElement
): void {
  getTextTargets(
    element
  ).forEach((target) => {
    restoreQBitProperty(
      target,
      "color"
    );
  });
}

/*
 * Restore only properties that Q-Bit previously captured.
 *
 * This is intentionally different from the old implementation,
 * which blindly removed styles from the application's DOM.
 */
export function clearQBitOverrideStyles(
  element: HTMLElement
): void {
  const properties = [
    "background-color",
    "border-color",

    "width",
    "height",

    "max-width",
    "max-height",

    "min-width",
    "min-height",

    "position",
    "z-index",

    "transform",
    "transform-origin",

    "border-radius",
  ];

  properties.forEach(
    (property) => {
      restoreQBitProperty(
        element,
        property
      );
    }
  );

  restoreTextColor(
    element
  );
}

export function applyQBitOverride(
  element: HTMLElement,
  override: QBitOverride
): void {
  /*
   * Background handling
   *
   * IMPORTANT:
   * Q-Bit no longer writes the CSS "background" shorthand.
   *
   * That shorthand destroys:
   * - gradients
   * - images
   * - glass effects
   * - layered backgrounds
   *
   * We change background-color only.
   */
  if (override.backgroundColor) {
    setQBitProperty(
      element,
      "background-color",
      override.backgroundColor
    );
  }

  if (override.borderColor) {
    setQBitProperty(
      element,
      "border-color",
      override.borderColor
    );
  }

  if (override.textColor) {
    applyTextColor(
      element,
      override.textColor
    );
  }

  if (
    typeof override.width ===
    "number" &&
    Number.isFinite(
      override.width
    )
  ) {
    setQBitProperty(
      element,
      "width",
      `${override.width}px`
    );

    setQBitProperty(
      element,
      "max-width",
      "none"
    );

    setQBitProperty(
      element,
      "min-width",
      "0"
    );
  }

  if (
    typeof override.height ===
    "number" &&
    Number.isFinite(
      override.height
    )
  ) {
    setQBitProperty(
      element,
      "height",
      `${override.height}px`
    );

    setQBitProperty(
      element,
      "max-height",
      "none"
    );

    setQBitProperty(
      element,
      "min-height",
      "0"
    );
  }

  if (
    typeof override.borderRadius ===
      "number" &&
    Number.isFinite(
      override.borderRadius
    )
  ) {
    setQBitProperty(
      element,
      "border-radius",
      `${Math.max(
        0,
        override.borderRadius
      )}px`
    );
  }

  const offsetX =
    Number.isFinite(
      override.offsetX
    )
      ? override.offsetX ?? 0
      : 0;

  const offsetY =
    Number.isFinite(
      override.offsetY
    )
      ? override.offsetY ?? 0
      : 0;

  const depthTransform =
    getDepthTransform(
      override.depth
    );

  const translateTransform =
    offsetX !== 0 ||
    offsetY !== 0
      ? `translate(${offsetX}px, ${offsetY}px)`
      : "";

  const transform = [
    depthTransform,
    translateTransform,
  ]
    .filter(Boolean)
    .join(" ");

  if (transform) {
    setQBitProperty(
      element,
      "transform-origin",
      "center center"
    );

    setQBitProperty(
      element,
      "transform",
      transform
    );
  }

  if (
    offsetX !== 0 ||
    offsetY !== 0
  ) {
    setQBitProperty(
      element,
      "position",
      "relative"
    );

    setQBitProperty(
      element,
      "z-index",
      "30"
    );
  }
}

export function applyAllQBitOverrides(): void {
  if (typeof document === "undefined") {
    return;
  }

  const overrides =
    safeReadOverrides();

  overrides.forEach(
    (override) => {
      const element =
        getQBitElement({
          id: override.id,
          scope: override.scope,
        });

      if (!element) {
        return;
      }

      applyQBitOverride(
        element,
        override
      );
    }
  );
}