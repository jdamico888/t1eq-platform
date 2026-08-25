"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

import ColorSwatchPicker from "@/components/appearance/ColorSwatchPicker";

import type {
  AppearanceSettings,
  LogoPlacement,
  ThreeDEffectLevel,
} from "@/types/appearance-settings";

import {
  fontFamilyOptions,
  fontSizeOptions,
  getAppearanceSettings,
  logoPlacementOptions,
  resetAppearanceSettings,
  saveAppearanceSettings,
  threeDEffectOptions,
  tileOrientationOptions,
  tileSizeOptions,
} from "@/services/appearance-settings";

import {
  applyAllQBitOverrides,
  applyQBitOverride,
  clearQBitOverrideStyles,
  getQBitDescriptor,
  getQBitElement,
  getQBitOverride,
  getQBitOverrides,
  removeQBitOverride,
  saveQBitOverrides,
  updateQBitOverride,
  qBitFontOptions,
  type QBitDescriptor,
  type QBitElementType,
  type QBitFontFamily,
  type QBitOverride,
  type QBitTextAlign,
} from "@/services/qbit-appearance";

type Position = {
  x: number;
  y: number;
};

type ResizeDirection =
  | "top"
  | "right"
  | "bottom"
  | "left"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

type DragStart = {
  pointerId: number;

  startX: number;
  startY: number;

  originalOffsetX: number;
  originalOffsetY: number;

  latestOffsetX: number;
  latestOffsetY: number;

  moved: boolean;

  element: HTMLElement;
  descriptor: QBitDescriptor;

  originalTransition: string;
};

type ResizeStart = {
  pointerId: number;

  direction: ResizeDirection;

  startX: number;
  startY: number;

  originalWidth: number;
  originalHeight: number;

  originalOffsetX: number;
  originalOffsetY: number;

  latestWidth: number;
  latestHeight: number;

  latestOffsetX: number;
  latestOffsetY: number;

  element: HTMLElement;
  descriptor: QBitDescriptor;

  originalTransition: string;
};

type PanelDragStart = {
  pointerId: number;

  startX: number;
  startY: number;

  originalX: number;
  originalY: number;
};

type DockDragStart = {
  pointerId: number;

  startX: number;
  startY: number;

  originalX: number;
  originalY: number;

  moved: boolean;
};

type QBitSessionSnapshot = {
  descriptor: QBitDescriptor;
  override: QBitOverride | null;
};

const globalTextColorStorageKey =
  "t1eq-appearance-global-text-color";

const panelPositionStorageKey =
  "t1eq-qbit-panel-position-v3";

const dockPositionStorageKey =
  "t1eq-qbit-dock-position-v3";

const editableSelector =
  "[data-t1eq-qbit-id][data-t1eq-qbit-type]";

const panelWidth = 380;
const panelHeight = 760;

const dockSize = 160;

const objectMinWidth = 32;
const objectMinHeight = 32;

const fieldLabelClass =
  "block text-[10px] font-black uppercase tracking-wide text-zinc-700";

const inputClass =
  "mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs font-bold text-black outline-none transition focus:border-black focus:ring-2 focus:ring-black/10";

const secondaryButtonClass =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-[11px] font-black text-black shadow-sm transition hover:bg-zinc-50";

const primaryButtonClass =
  "rounded-md bg-black px-3 py-2 text-[11px] font-black text-white shadow-sm transition hover:bg-zinc-800";

function safeReadPosition(
  storageKey: string,
  fallback: Position
): Position {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const storedValue =
      localStorage.getItem(storageKey);

    if (!storedValue) {
      return fallback;
    }

    const parsedValue = JSON.parse(
      storedValue
    ) as Partial<Position>;

    if (
      typeof parsedValue.x !== "number" ||
      typeof parsedValue.y !== "number"
    ) {
      return fallback;
    }

    return {
      x: parsedValue.x,
      y: parsedValue.y,
    };
  } catch {
    return fallback;
  }
}

function savePosition(
  storageKey: string,
  position: Position
): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    storageKey,
    JSON.stringify(position)
  );
}

function getDefaultDockPosition(): Position {
  if (typeof window === "undefined") {
    return {
      x: 32,
      y: 32,
    };
  }

  return {
    x: Math.max(
      16,
      window.innerWidth - dockSize - 24
    ),

    y: Math.max(
      16,
      window.innerHeight - dockSize - 24
    ),
  };
}

function getDefaultPanelPosition(): Position {
  if (typeof window === "undefined") {
    return {
      x: 24,
      y: 80,
    };
  }

  return {
    x: Math.max(
      16,
      window.innerWidth - panelWidth - 24
    ),

    y: 80,
  };
}

/**
 * How close to the window edge Q-Bit is allowed to sit.
 *
 * The top is deliberately zero. Q-Bit edits the page it floats over, and
 * the thing being edited is often at the very top of it — a page header, a
 * logo, the sidebar's brand card. A gutter there meant the editor could
 * never be moved fully clear of exactly the elements it exists to work on.
 *
 * The other three keep a small margin so the panel cannot be pushed
 * half-off the window and become hard to grab.
 */
const editorTopGutter = 0;
const editorEdgeGutter = 8;

function clampDockPosition(
  position: Position
): Position {
  if (typeof window === "undefined") {
    return position;
  }

  return {
    x: Math.min(
      Math.max(editorEdgeGutter, position.x),
      Math.max(
        editorEdgeGutter,
        window.innerWidth - dockSize - editorEdgeGutter
      )
    ),

    y: Math.min(
      Math.max(editorTopGutter, position.y),
      Math.max(
        editorTopGutter,
        window.innerHeight - dockSize - editorEdgeGutter
      )
    ),
  };
}

function clampPanelPosition(
  position: Position
): Position {
  if (typeof window === "undefined") {
    return position;
  }

  const effectiveHeight = Math.min(
    panelHeight,
    window.innerHeight - editorEdgeGutter
  );

  return {
    x: Math.min(
      Math.max(editorEdgeGutter, position.x),
      Math.max(
        editorEdgeGutter,
        window.innerWidth - panelWidth - editorEdgeGutter
      )
    ),

    y: Math.min(
      Math.max(editorTopGutter, position.y),
      Math.max(
        editorTopGutter,
        window.innerHeight -
          effectiveHeight -
          editorEdgeGutter
      )
    ),
  };
}

function applyGlobalTextColor(
  textColor: string
): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.style.setProperty(
    "--t1eq-global-text-color",
    textColor
  );
}

function readFileAsDataUrl(
  file: File
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (
        typeof reader.result === "string"
      ) {
        resolve(reader.result);
        return;
      }

      reject(
        new Error(
          "Unable to read image file."
        )
      );
    };

    reader.onerror = () => {
      reject(
        new Error(
          "Unable to read image file."
        )
      );
    };

    reader.readAsDataURL(file);
  });
}

async function normalizeUploadedLogo(
  file: File
): Promise<string> {
  const rawDataUrl =
    await readFileAsDataUrl(file);

  if (file.type === "image/svg+xml") {
    return rawDataUrl;
  }

  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () => {
      const maxDimension = 1400;

      const largestSide = Math.max(
        image.width,
        image.height
      );

      const scale =
        largestSide > maxDimension
          ? maxDimension / largestSide
          : 1;

      const canvas =
        document.createElement(
          "canvas"
        );

      canvas.width = Math.max(
        1,
        Math.round(
          image.width * scale
        )
      );

      canvas.height = Math.max(
        1,
        Math.round(
          image.height * scale
        )
      );

      const context =
        canvas.getContext("2d");

      if (!context) {
        resolve(rawDataUrl);
        return;
      }

      context.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      context.drawImage(
        image,
        0,
        0,
        canvas.width,
        canvas.height
      );

      resolve(
        canvas.toDataURL("image/png")
      );
    };

    image.onerror = () => {
      resolve(rawDataUrl);
    };

    image.src = rawDataUrl;
  });
}

function logoIsUploadedImage(
  logoUrl: string
): boolean {
  return logoUrl.startsWith(
    "data:image/"
  );
}

function friendlyTypeName(
  type: QBitElementType
): string {
  switch (type) {
    case "information-balloon":
      return "Information Balloon";

    case "sidebar-button":
      return "Sidebar Button";

    case "action-button":
      return "Action Button";

    case "page-card":
      return "Page Card";

    default:
      return type
        .split("-")
        .map(
          (word) =>
            word.charAt(0).toUpperCase() +
            word.slice(1)
        )
        .join(" ");
  }
}

function InactiveQBitGraphic() {
  return (
    <img
      src="/appearance/qbit-rest.png"
      alt=""
      aria-hidden="true"
      draggable={false}
      className="h-40 w-40 object-contain drop-shadow-2xl"
    />
  );
}

function ActiveQBitGraphic() {
  return (
    <img
      src="/appearance/qbit-edit.png"
      alt=""
      aria-hidden="true"
      draggable={false}
      className="h-40 w-40 object-contain drop-shadow-2xl"
    />
  );
}

export default function AppearanceEditor() {
  const dockButtonRef =
    useRef<HTMLButtonElement | null>(
      null
    );

  const panelRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const activeElementRef =
    useRef<HTMLElement | null>(
      null
    );

  const sessionSnapshotRef =
    useRef<QBitSessionSnapshot | null>(
      null
    );

  const dragStartRef =
    useRef<DragStart | null>(
      null
    );

  const resizeStartRef =
    useRef<ResizeStart | null>(
      null
    );

  const panelDragStartRef =
    useRef<PanelDragStart | null>(
      null
    );

  const dockDragStartRef =
    useRef<DockDragStart | null>(
      null
    );

  const [
    settings,
    setSettings,
  ] =
    useState<AppearanceSettings>(
      getAppearanceSettings()
    );

  const [
    globalTextColor,
    setGlobalTextColor,
  ] = useState("#ffffff");

  const [
    editorActive,
    setEditorActive,
  ] = useState(false);

  const [
    editorOpen,
    setEditorOpen,
  ] = useState(false);

  const [
    selectedDescriptor,
    setSelectedDescriptor,
  ] =
    useState<QBitDescriptor | null>(
      null
    );

  const [
    selectedOverride,
    setSelectedOverride,
  ] =
    useState<QBitOverride | null>(
      null
    );

  const [
    activeRect,
    setActiveRect,
  ] =
    useState<DOMRect | null>(
      null
    );

  const [
    dockPosition,
    setDockPosition,
  ] =
    useState<Position | null>(
      null
    );

  const [
    panelPosition,
    setPanelPosition,
  ] =
    useState<Position | null>(
      null
    );

  const [
    logoUploadMessage,
    setLogoUploadMessage,
  ] = useState("");

  const [
    logoUploadError,
    setLogoUploadError,
  ] = useState("");

  /*
   * The LOGO section in the element panel starts collapsed, so selecting a
   * logo element does not push the styling controls out of view.
   */
  const [
    logoSectionOpen,
    setLogoSectionOpen,
  ] = useState(false);

  const selectedElement =
    useMemo(() => {
      if (!selectedDescriptor) {
        return null;
      }

      const current =
        activeElementRef.current;

      if (
        current &&
        current.isConnected
      ) {
        const currentDescriptor =
          getQBitDescriptor(current);

        if (
          currentDescriptor &&
          currentDescriptor.id ===
            selectedDescriptor.id &&
          currentDescriptor.scope ===
            selectedDescriptor.scope
        ) {
          return current;
        }
      }

      const fresh =
        getQBitElement(
          selectedDescriptor
        );

      if (fresh) {
        activeElementRef.current =
          fresh;
      }

      return fresh;
    }, [selectedDescriptor]);

  /*
   * The logo controls belong on whatever a person would click when they
   * want to change the logo — the places it actually shows up:
   *
   *  - the logo box itself
   *  - the page background (the logo watermarks onto it)
   *  - the content container sitting directly on that background, which is
   *    what a click usually lands on: the background itself is only
   *    reachable at its padding edges
   *  - the sidebar background
   *  - anywhere on the sidebar top tile, including the "T1" placeholder and
   *    the company name, since the whole tile reads as the brand block
   *
   * Deliberately not "anything inside a page background" — that is every
   * element on every page, and the button would follow you everywhere.
   */
  const selectionCarriesLogo =
    useMemo(() => {
      if (!selectedDescriptor) {
        return false;
      }

      if (
        selectedDescriptor.type === "logo" ||
        selectedDescriptor.type === "background" ||
        selectedDescriptor.type === "sidebar"
      ) {
        return true;
      }

      if (!selectedElement) {
        return false;
      }

      const pageBackgroundSelector =
        '[data-t1eq-page-background="true"]';

      if (
        selectedElement.matches(
          pageBackgroundSelector
        ) ||
        selectedElement.parentElement?.matches(
          pageBackgroundSelector
        )
      ) {
        return true;
      }

      return Boolean(
        selectedElement.closest(
          '[data-t1eq-qbit-id="sidebar-brand-card"]'
        )
      );
    }, [
      selectedDescriptor,
      selectedElement,
    ]);

  /* =========================================================
     Q-BIT LOCK STATE
     ========================================================= */

  function resetQBitLockElement(
    element: HTMLElement
  ): void {
    element.removeAttribute(
      "data-t1eq-qbit-active"
    );

    element.removeAttribute(
      "data-t1eq-qbit-locked"
    );

    element.style.removeProperty(
      "pointer-events"
    );
  }

  function clearQBitLockState(): void {
    if (
      typeof document === "undefined"
    ) {
      return;
    }

    document
      .querySelectorAll<HTMLElement>(
        editableSelector
      )
      .forEach((element) => {
        resetQBitLockElement(
          element
        );
      });
  }

  function applyQBitLockState(
    activeElement: HTMLElement | null
  ): void {
    if (
      typeof document === "undefined"
    ) {
      return;
    }

    clearQBitLockState();

    if (!activeElement) {
      return;
    }

    document
      .querySelectorAll<HTMLElement>(
        editableSelector
      )
      .forEach((element) => {
        if (
          element.closest(
            "[data-t1eq-appearance-editor='true']"
          )
        ) {
          return;
        }

        const isActiveFamily =
          element === activeElement ||
          element.contains(
            activeElement
          ) ||
          activeElement.contains(
            element
          );

        if (isActiveFamily) {
          if (
            element === activeElement
          ) {
            element.setAttribute(
              "data-t1eq-qbit-active",
              "true"
            );
          }

          return;
        }

        element.setAttribute(
          "data-t1eq-qbit-locked",
          "true"
        );

        element.style.setProperty(
          "pointer-events",
          "none",
          "important"
        );
      });
  }

  /* =========================================================
     ACTIVE OBJECT
     ========================================================= */

  function refreshActiveRect(): void {
    const element =
      activeElementRef.current;

    if (
      !element ||
      !element.isConnected
    ) {
      setActiveRect(null);
      return;
    }

    setActiveRect(
      element.getBoundingClientRect()
    );
  }

  function openEditSession(
    element: HTMLElement
  ): void {
    const descriptor =
      getQBitDescriptor(element);

    if (!descriptor) {
      return;
    }

    const existingOverride =
      getQBitOverride(descriptor);

    sessionSnapshotRef.current = {
      descriptor,
      override: existingOverride
        ? { ...existingOverride }
        : null,
    };

    activeElementRef.current =
      element;

    setSelectedDescriptor(
      descriptor
    );

    setSelectedOverride(
      existingOverride
    );

    setActiveRect(
      element.getBoundingClientRect()
    );

    setEditorActive(false);
    setEditorOpen(true);

    window.requestAnimationFrame(
      () => {
        applyQBitLockState(
          element
        );

        refreshActiveRect();
      }
    );
  }

  function clearEditSession(): void {
    clearQBitLockState();

    activeElementRef.current =
      null;

    sessionSnapshotRef.current =
      null;

    setSelectedDescriptor(null);
    setSelectedOverride(null);
    setActiveRect(null);
  }

  /* =========================================================
     OBJECT MOVE
     ========================================================= */

  function startObjectDrag(
    event: ReactPointerEvent<HTMLDivElement>
  ): void {
    if (
      !selectedDescriptor ||
      !selectedElement
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const currentOverride =
      getQBitOverride(
        selectedDescriptor
      );

    const originalOffsetX =
      currentOverride?.offsetX ??
      0;

    const originalOffsetY =
      currentOverride?.offsetY ??
      0;

    dragStartRef.current = {
      pointerId:
        event.pointerId,

      startX:
        event.clientX,

      startY:
        event.clientY,

      originalOffsetX,
      originalOffsetY,

      latestOffsetX:
        originalOffsetX,

      latestOffsetY:
        originalOffsetY,

      moved: false,

      element:
        selectedElement,

      descriptor:
        selectedDescriptor,

      originalTransition:
        selectedElement.style.getPropertyValue(
          "transition"
        ),
    };

    selectedElement.style.setProperty(
      "transition",
      "none",
      "important"
    );
  }

  /* =========================================================
     OBJECT RESIZE
     ========================================================= */

  function startObjectResize(
    event: ReactPointerEvent<HTMLDivElement>,
    direction: ResizeDirection
  ): void {
    if (
      !selectedDescriptor ||
      !selectedElement
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const rect =
      selectedElement.getBoundingClientRect();

    const currentOverride =
      getQBitOverride(
        selectedDescriptor
      );

    const originalOffsetX =
      currentOverride?.offsetX ??
      0;

    const originalOffsetY =
      currentOverride?.offsetY ??
      0;

    resizeStartRef.current = {
      pointerId:
        event.pointerId,

      direction,

      startX:
        event.clientX,

      startY:
        event.clientY,

      originalWidth:
        rect.width,

      originalHeight:
        rect.height,

      originalOffsetX,
      originalOffsetY,

      latestWidth:
        rect.width,

      latestHeight:
        rect.height,

      latestOffsetX:
        originalOffsetX,

      latestOffsetY:
        originalOffsetY,

      element:
        selectedElement,

      descriptor:
        selectedDescriptor,

      originalTransition:
        selectedElement.style.getPropertyValue(
          "transition"
        ),
    };

    selectedElement.style.setProperty(
      "transition",
      "none",
      "important"
    );
  }

  /* =========================================================
     POINTER PREVIEW
     ========================================================= */

  function handleObjectPointerMove(
    event: globalThis.PointerEvent
  ): void {
    const dragStart =
      dragStartRef.current;

    if (
      dragStart &&
      dragStart.pointerId ===
        event.pointerId
    ) {
      const deltaX =
        event.clientX -
        dragStart.startX;

      const deltaY =
        event.clientY -
        dragStart.startY;

      if (
        Math.abs(deltaX) > 3 ||
        Math.abs(deltaY) > 3
      ) {
        dragStart.moved = true;
      }

      const offsetX =
        dragStart.originalOffsetX +
        deltaX;

      const offsetY =
        dragStart.originalOffsetY +
        deltaY;

      dragStart.latestOffsetX =
        offsetX;

      dragStart.latestOffsetY =
        offsetY;

      const currentOverride =
        getQBitOverride(
          dragStart.descriptor
        );

      const previewOverride: QBitOverride = {
        id:
          dragStart.descriptor.id,

        type:
          dragStart.descriptor.type,

        scope:
          dragStart.descriptor.scope,

        ...(currentOverride ?? {}),

        offsetX,
        offsetY,
      };

      clearQBitOverrideStyles(
        dragStart.element
      );

      applyQBitOverride(
        dragStart.element,
        previewOverride
      );

      setActiveRect(
        dragStart.element.getBoundingClientRect()
      );

      return;
    }

    const resizeStart =
      resizeStartRef.current;

    if (
      !resizeStart ||
      resizeStart.pointerId !==
        event.pointerId
    ) {
      return;
    }

    const deltaX =
      event.clientX -
      resizeStart.startX;

    const deltaY =
      event.clientY -
      resizeStart.startY;

    let nextWidth =
      resizeStart.originalWidth;

    let nextHeight =
      resizeStart.originalHeight;

    let nextOffsetX =
      resizeStart.originalOffsetX;

    let nextOffsetY =
      resizeStart.originalOffsetY;

    const direction =
      resizeStart.direction;

    const resizingLeft =
      direction === "left" ||
      direction === "top-left" ||
      direction === "bottom-left";

    const resizingRight =
      direction === "right" ||
      direction === "top-right" ||
      direction === "bottom-right";

    const resizingTop =
      direction === "top" ||
      direction === "top-left" ||
      direction === "top-right";

    const resizingBottom =
      direction === "bottom" ||
      direction === "bottom-left" ||
      direction === "bottom-right";

    if (resizingRight) {
      nextWidth = Math.max(
        objectMinWidth,
        resizeStart.originalWidth +
          deltaX
      );
    }

    if (resizingLeft) {
      const proposedWidth =
        resizeStart.originalWidth -
        deltaX;

      if (
        proposedWidth >=
        objectMinWidth
      ) {
        nextWidth =
          proposedWidth;

        nextOffsetX =
          resizeStart.originalOffsetX +
          deltaX;
      }
    }

    if (resizingBottom) {
      nextHeight = Math.max(
        objectMinHeight,
        resizeStart.originalHeight +
          deltaY
      );
    }

    if (resizingTop) {
      const proposedHeight =
        resizeStart.originalHeight -
        deltaY;

      if (
        proposedHeight >=
        objectMinHeight
      ) {
        nextHeight =
          proposedHeight;

        nextOffsetY =
          resizeStart.originalOffsetY +
          deltaY;
      }
    }

    resizeStart.latestWidth =
      nextWidth;

    resizeStart.latestHeight =
      nextHeight;

    resizeStart.latestOffsetX =
      nextOffsetX;

    resizeStart.latestOffsetY =
      nextOffsetY;

    const currentOverride =
      getQBitOverride(
        resizeStart.descriptor
      );

    const previewOverride: QBitOverride = {
      id:
        resizeStart.descriptor.id,

      type:
        resizeStart.descriptor.type,

      scope:
        resizeStart.descriptor.scope,

      ...(currentOverride ?? {}),

      width:
        nextWidth,

      height:
        nextHeight,

      offsetX:
        nextOffsetX,

      offsetY:
        nextOffsetY,
    };

    clearQBitOverrideStyles(
      resizeStart.element
    );

    applyQBitOverride(
      resizeStart.element,
      previewOverride
    );

    setActiveRect(
      resizeStart.element.getBoundingClientRect()
    );
  }

  /* =========================================================
     FINISH MOVE / RESIZE
     ========================================================= */

  function finishObjectGesture(): void {
    const dragStart =
      dragStartRef.current;

    if (dragStart) {
      if (
        dragStart.originalTransition
      ) {
        dragStart.element.style.setProperty(
          "transition",
          dragStart.originalTransition,
          "important"
        );
      } else {
        dragStart.element.style.removeProperty(
          "transition"
        );
      }

      if (dragStart.moved) {
        const nextOverride =
          updateQBitOverride(
            dragStart.descriptor,
            {
              offsetX:
                Math.round(
                  dragStart.latestOffsetX
                ),

              offsetY:
                Math.round(
                  dragStart.latestOffsetY
                ),
            }
          );

        setSelectedOverride(
          nextOverride
        );
      }

      dragStartRef.current =
        null;
    }

    const resizeStart =
      resizeStartRef.current;

    if (resizeStart) {
      if (
        resizeStart.originalTransition
      ) {
        resizeStart.element.style.setProperty(
          "transition",
          resizeStart.originalTransition,
          "important"
        );
      } else {
        resizeStart.element.style.removeProperty(
          "transition"
        );
      }

      const nextOverride =
        updateQBitOverride(
          resizeStart.descriptor,
          {
            width:
              Math.round(
                resizeStart.latestWidth
              ),

            height:
              Math.round(
                resizeStart.latestHeight
              ),

            offsetX:
              Math.round(
                resizeStart.latestOffsetX
              ),

            offsetY:
              Math.round(
                resizeStart.latestOffsetY
              ),
          }
        );

      setSelectedOverride(
        nextOverride
      );

      resizeStartRef.current =
        null;
    }

    window.requestAnimationFrame(
      refreshActiveRect
    );
  }

  /* =========================================================
     SAVE / CANCEL
     ========================================================= */

  function closeEditor(): void {
    finishObjectGesture();

    setEditorOpen(false);
    setEditorActive(false);

    clearEditSession();
  }

  function cancelEditor(): void {
    finishObjectGesture();

    const snapshot =
      sessionSnapshotRef.current;

    if (snapshot) {
      const element =
        getQBitElement(
          snapshot.descriptor
        );

      removeQBitOverride(
        snapshot.descriptor
      );

      if (element) {
        clearQBitOverrideStyles(
          element
        );
      }

      if (snapshot.override) {
        const overrides =
          getQBitOverrides();

        saveQBitOverrides([
          ...overrides.filter(
            (override) =>
              !(
                override.id ===
                  snapshot.descriptor.id &&
                override.scope ===
                  snapshot.descriptor.scope
              )
          ),

          snapshot.override,
        ]);

        if (element) {
          applyQBitOverride(
            element,
            snapshot.override
          );
        }
      }
    }

    setEditorOpen(false);
    setEditorActive(false);

    clearEditSession();
  }

  /* =========================================================
     APPEARANCE OVERRIDES
     ========================================================= */

  function updateSelectedOverride(
    updates: Partial<
      Omit<
        QBitOverride,
        "id" | "type" | "scope"
      >
    >
  ): void {
    if (!selectedDescriptor) {
      return;
    }

    const nextOverride =
      updateQBitOverride(
        selectedDescriptor,
        updates
      );

    const element =
      activeElementRef.current &&
      activeElementRef.current.isConnected
        ? activeElementRef.current
        : getQBitElement(
            selectedDescriptor
          );

    if (element) {
      clearQBitOverrideStyles(
        element
      );

      applyQBitOverride(
        element,
        nextOverride
      );

      activeElementRef.current =
        element;

      applyQBitLockState(
        element
      );
    }

    setSelectedOverride(
      nextOverride
    );

    window.requestAnimationFrame(
      refreshActiveRect
    );
  }

  function resetSelectedObject(): void {
    if (!selectedDescriptor) {
      return;
    }

    removeQBitOverride(
      selectedDescriptor
    );

    const element =
      activeElementRef.current &&
      activeElementRef.current.isConnected
        ? activeElementRef.current
        : getQBitElement(
            selectedDescriptor
          );

    if (element) {
      clearQBitOverrideStyles(
        element
      );

      activeElementRef.current =
        element;

      applyQBitLockState(
        element
      );
    }

    setSelectedOverride(null);

    window.requestAnimationFrame(
      refreshActiveRect
    );
  }

  /* =========================================================
     GLOBAL SETTINGS
     ========================================================= */

  function updateSettings(
    updates: Partial<AppearanceSettings>
  ): void {
    const nextSettings =
      saveAppearanceSettings({
        ...settings,
        ...updates,
      });

    setSettings(nextSettings);

    window.requestAnimationFrame(
      applyAllQBitOverrides
    );
  }

  function updateGlobalTextColor(
    value: string
  ): void {
    setGlobalTextColor(value);

    localStorage.setItem(
      globalTextColorStorageKey,
      value
    );

    applyGlobalTextColor(value);
  }

  function handleResetAll(): void {
    const resetSettings =
      resetAppearanceSettings();

    setSettings(resetSettings);

    const overrides =
      getQBitOverrides();

    overrides.forEach((override) => {
      const element =
        getQBitElement(override);

      if (element) {
        clearQBitOverrideStyles(
          element
        );
      }
    });

    saveQBitOverrides([]);

    updateGlobalTextColor(
      "#ffffff"
    );

    setSelectedOverride(null);

    window.requestAnimationFrame(
      refreshActiveRect
    );
  }

  /* =========================================================
     LOGO
     ========================================================= */

  async function handleLogoFileUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setLogoUploadMessage("");
    setLogoUploadError("");

    if (
      !file.type.startsWith("image/")
    ) {
      setLogoUploadError(
        "Choose an image file."
      );

      event.target.value = "";

      return;
    }

    try {
      setLogoUploadMessage(
        "Preparing logo..."
      );

      const logoDataUrl =
        await normalizeUploadedLogo(
          file
        );

      updateSettings({
        logoUrl:
          logoDataUrl,
      });

      setLogoUploadMessage(
        "Logo uploaded and saved."
      );
    } catch {
      setLogoUploadMessage("");

      setLogoUploadError(
        "Logo upload failed."
      );
    } finally {
      event.target.value = "";
    }
  }

  function renderLogoControls() {
    const logoUrlInputValue =
      logoIsUploadedImage(
        settings.logoUrl
      )
        ? ""
        : settings.logoUrl;

    return (
      <>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2">
          <label className="block">
            <span
              className={
                fieldLabelClass
              }
            >
              Upload Logo
            </span>

            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                void handleLogoFileUpload(
                  event
                );
              }}
              className="mt-1 w-full rounded-md border border-dashed border-zinc-300 bg-white px-2 py-2 text-[11px] font-bold text-black file:mr-2 file:rounded-md file:border-0 file:bg-black file:px-2 file:py-1 file:text-[10px] file:font-black file:text-white"
            />
          </label>

          {logoUploadMessage && (
            <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">
              {logoUploadMessage}
            </p>
          )}

          {logoUploadError && (
            <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-red-700">
              {logoUploadError}
            </p>
          )}
        </div>

        <label className="block">
          <span
            className={
              fieldLabelClass
            }
          >
            Logo Placement
          </span>

          <select
            value={
              settings.logoPlacement
            }
            onChange={(event) =>
              updateSettings({
                logoPlacement:
                  event.target
                    .value as LogoPlacement,
              })
            }
            className={
              inputClass
            }
          >
            {logoPlacementOptions.map(
              (option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              )
            )}
          </select>
        </label>

        <label className="block">
          <span
            className={
              fieldLabelClass
            }
          >
            Advanced Logo Path
          </span>

          <input
            value={
              logoUrlInputValue
            }
            onChange={(event) =>
              updateSettings({
                logoUrl:
                  event.target.value,
              })
            }
            className={
              inputClass
            }
            placeholder="/appearance/tier-one-logo.png"
          />
        </label>
      </>
    );
  }

  /* =========================================================
     INITIALIZATION
     ========================================================= */

  useEffect(() => {
    const initialDockPosition =
      clampDockPosition(
        safeReadPosition(
          dockPositionStorageKey,
          getDefaultDockPosition()
        )
      );

    const initialPanelPosition =
      clampPanelPosition(
        safeReadPosition(
          panelPositionStorageKey,
          getDefaultPanelPosition()
        )
      );

    setDockPosition(
      initialDockPosition
    );

    setPanelPosition(
      initialPanelPosition
    );

    const savedGlobalTextColor =
      localStorage.getItem(
        globalTextColorStorageKey
      ) || "#ffffff";

    setGlobalTextColor(
      savedGlobalTextColor
    );

    applyGlobalTextColor(
      savedGlobalTextColor
    );

    window.requestAnimationFrame(
      applyAllQBitOverrides
    );

    function handleAppearanceChanged() {
      setSettings(
        getAppearanceSettings()
      );

      window.requestAnimationFrame(
        applyAllQBitOverrides
      );
    }

    function handleQBitOverridesChanged() {
      window.requestAnimationFrame(
        applyAllQBitOverrides
      );
    }

    function handleResize() {
      setDockPosition(
        (current) => {
          if (!current) {
            return current;
          }

          const next =
            clampDockPosition(
              current
            );

          savePosition(
            dockPositionStorageKey,
            next
          );

          return next;
        }
      );

      setPanelPosition(
        (current) => {
          if (!current) {
            return current;
          }

          const next =
            clampPanelPosition(
              current
            );

          savePosition(
            panelPositionStorageKey,
            next
          );

          return next;
        }
      );

      refreshActiveRect();
    }

    window.addEventListener(
      "t1eq-appearance-settings-changed",
      handleAppearanceChanged
    );

    window.addEventListener(
      "t1eq-qbit-overrides-changed",
      handleQBitOverridesChanged
    );

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      window.removeEventListener(
        "t1eq-appearance-settings-changed",
        handleAppearanceChanged
      );

      window.removeEventListener(
        "t1eq-qbit-overrides-changed",
        handleQBitOverridesChanged
      );

      window.removeEventListener(
        "resize",
        handleResize
      );

      clearQBitLockState();
    };
  }, []);

  /* =========================================================
     SESSION LOCK
     ========================================================= */

  useEffect(() => {
    if (
      !editorOpen ||
      !selectedDescriptor
    ) {
      clearQBitLockState();
      return;
    }

    let element =
      activeElementRef.current;

    if (
      !element ||
      !element.isConnected
    ) {
      element =
        getQBitElement(
          selectedDescriptor
        );

      activeElementRef.current =
        element;
    }

    if (!element) {
      clearQBitLockState();

      setActiveRect(
        null
      );

      return;
    }

    applyQBitLockState(
      element
    );

    setActiveRect(
      element.getBoundingClientRect()
    );

    return () => {
      clearQBitLockState();
    };
  }, [
    editorOpen,
    selectedDescriptor,
  ]);

  /* =========================================================
     BALLOON CLICK-THROUGH

     Information balloons are pointer-events: none by default (see
     appearance-theme.css) so a decorative tooltip never blocks a
     normal click-through to the tile underneath it. That means they
     are otherwise impossible to click-select in Q-Bit. While Q-Bit
     is actively in click-to-select mode, flag <html> so the CSS can
     turn pointer-events back on for balloons specifically.
     ========================================================= */

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.documentElement.dataset.t1eqQbitEditing =
      editorActive ? "true" : "false";

    return () => {
      document.documentElement.dataset.t1eqQbitEditing =
        "false";
    };
  }, [editorActive]);

  /* =========================================================
     Q-BIT SELECTION
     ========================================================= */

  useEffect(() => {
    function handleDocumentClick(
      event: MouseEvent
    ) {
      if (!editorActive) {
        return;
      }

      const target =
        event.target;

      if (
        !(target instanceof HTMLElement)
      ) {
        return;
      }

      if (
        dockButtonRef.current?.contains(
          target
        )
      ) {
        return;
      }

      if (
        panelRef.current?.contains(
          target
        )
      ) {
        return;
      }

      if (
        target.closest(
          "[data-t1eq-appearance-editor='true']"
        )
      ) {
        return;
      }

      const editableElement =
        target.closest<HTMLElement>(
          editableSelector
        );

      if (!editableElement) {
        return;
      }

      const descriptor =
        getQBitDescriptor(
          editableElement
        );

      if (!descriptor) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      openEditSession(
        editableElement
      );
    }

    document.addEventListener(
      "click",
      handleDocumentClick,
      true
    );

    return () => {
      document.removeEventListener(
        "click",
        handleDocumentClick,
        true
      );
    };
  }, [
    editorActive,
  ]);

  /* =========================================================
     GLOBAL POINTER EVENTS
     ========================================================= */

  useEffect(() => {
    function handleScroll() {
      refreshActiveRect();
    }

    window.addEventListener(
      "scroll",
      handleScroll,
      true
    );

    window.addEventListener(
      "pointermove",
      handleObjectPointerMove
    );

    window.addEventListener(
      "pointerup",
      finishObjectGesture
    );

    window.addEventListener(
      "pointercancel",
      finishObjectGesture
    );

    window.addEventListener(
      "blur",
      finishObjectGesture
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll,
        true
      );

      window.removeEventListener(
        "pointermove",
        handleObjectPointerMove
      );

      window.removeEventListener(
        "pointerup",
        finishObjectGesture
      );

      window.removeEventListener(
        "pointercancel",
        finishObjectGesture
      );

      window.removeEventListener(
        "blur",
        finishObjectGesture
      );
    };
  }, []);

  /* =========================================================
     Q-BIT DOCK
     ========================================================= */

  function handleDockPointerDown(
    event: ReactPointerEvent<HTMLButtonElement>
  ): void {
    if (!dockPosition) {
      return;
    }

    dockDragStartRef.current = {
      pointerId:
        event.pointerId,

      startX:
        event.clientX,

      startY:
        event.clientY,

      originalX:
        dockPosition.x,

      originalY:
        dockPosition.y,

      moved: false,
    };
  }

  function handleDockPointerMove(
    event: ReactPointerEvent<HTMLButtonElement>
  ): void {
    const start =
      dockDragStartRef.current;

    if (
      !start ||
      start.pointerId !==
        event.pointerId
    ) {
      return;
    }

    const deltaX =
      event.clientX -
      start.startX;

    const deltaY =
      event.clientY -
      start.startY;

    if (
      Math.abs(deltaX) > 3 ||
      Math.abs(deltaY) > 3
    ) {
      start.moved = true;
    }

    setDockPosition(
      clampDockPosition({
        x:
          start.originalX +
          deltaX,

        y:
          start.originalY +
          deltaY,
      })
    );
  }

  function handleDockPointerUp(
    event: ReactPointerEvent<HTMLButtonElement>
  ): void {
    const start =
      dockDragStartRef.current;

    if (
      !start ||
      start.pointerId !==
        event.pointerId
    ) {
      return;
    }

    if (dockPosition) {
      savePosition(
        dockPositionStorageKey,
        dockPosition
      );
    }

    if (!start.moved) {
      if (
        selectedDescriptor
      ) {
        setEditorOpen(
          true
        );

        setEditorActive(
          false
        );
      } else {
        clearQBitLockState();

        setEditorOpen(
          false
        );

        setEditorActive(
          (current) =>
            !current
        );
      }
    }

    dockDragStartRef.current =
      null;
  }

  /* =========================================================
     EDITOR PANEL DRAG
     ========================================================= */

  function handlePanelPointerDown(
    event: ReactPointerEvent<HTMLDivElement>
  ): void {
    if (!panelPosition) {
      return;
    }

    const target =
      event.target;

    if (
      target instanceof HTMLElement &&
      target.closest(
        "button, input, select, textarea, label"
      )
    ) {
      return;
    }

    panelDragStartRef.current = {
      pointerId:
        event.pointerId,

      startX:
        event.clientX,

      startY:
        event.clientY,

      originalX:
        panelPosition.x,

      originalY:
        panelPosition.y,
    };
  }

  function handlePanelPointerMove(
    event: ReactPointerEvent<HTMLDivElement>
  ): void {
    const start =
      panelDragStartRef.current;

    if (
      !start ||
      start.pointerId !==
        event.pointerId
    ) {
      return;
    }

    setPanelPosition(
      clampPanelPosition({
        x:
          start.originalX +
          event.clientX -
          start.startX,

        y:
          start.originalY +
          event.clientY -
          start.startY,
      })
    );
  }

  function handlePanelPointerUp(
    event: ReactPointerEvent<HTMLDivElement>
  ): void {
    const start =
      panelDragStartRef.current;

    if (
      !start ||
      start.pointerId !==
        event.pointerId
    ) {
      return;
    }

    if (panelPosition) {
      savePosition(
        panelPositionStorageKey,
        panelPosition
      );
    }

    panelDragStartRef.current =
      null;
  }

  /* =========================================================
     POSITION STYLES
     ========================================================= */

  const dockStyle: CSSProperties =
    dockPosition
      ? {
          left:
            dockPosition.x,

          top:
            dockPosition.y,
        }
      : {
          right: 24,
          bottom: 24,
        };

  const panelStyle: CSSProperties =
    panelPosition
      ? {
          left:
            panelPosition.x,

          top:
            panelPosition.y,

          width:
            panelWidth,

          height:
            `min(${panelHeight}px, calc(100vh - 16px))`,
        }
      : {
          right: 24,
          top: 80,

          width:
            panelWidth,

          height:
            `min(${panelHeight}px, calc(100vh - 16px))`,
        };

  const backgroundColor =
    selectedOverride?.backgroundColor ??
    "";

  const borderColor =
    selectedOverride?.borderColor ??
    "";

  const textColor =
    selectedOverride?.textColor ??
    "";

  const depth =
    selectedOverride?.depth ??
    settings.pageThreeDEffect;

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <>
      {editorActive && (
        <div
          data-t1eq-appearance-editor="true"
          className="fixed left-1/2 top-6 z-[10001] -translate-x-1/2 rounded-2xl border border-orange-400 bg-orange-50 px-5 py-3 text-sm font-black uppercase tracking-wide text-orange-700 shadow-xl"
        >
          Select an element to edit
        </div>
      )}

      <button
        ref={
          dockButtonRef
        }
        type="button"
        aria-label="Appearance Editor Q-Bit"
        title={
          editorActive
            ? "Select Element"
            : "Appearance Editor"
        }
        onPointerDown={
          handleDockPointerDown
        }
        onPointerMove={
          handleDockPointerMove
        }
        onPointerUp={
          handleDockPointerUp
        }
        onPointerCancel={() => {
          dockDragStartRef.current =
            null;
        }}
        onDoubleClick={(
          event
        ) => {
          event.preventDefault();

          clearEditSession();

          setEditorActive(
            false
          );

          setEditorOpen(
            true
          );
        }}
        className="fixed z-[10000] flex h-40 w-40 touch-none select-none items-center justify-center bg-transparent p-0 transition hover:scale-105"
        style={
          dockStyle
        }
      >
        {editorActive ? (
          <ActiveQBitGraphic />
        ) : (
          <InactiveQBitGraphic />
        )}
      </button>

      {editorOpen && (
        <div
          ref={
            panelRef
          }
          data-t1eq-appearance-editor="true"
          className="fixed z-[10000] overflow-hidden rounded-2xl border border-zinc-300 bg-white text-black shadow-2xl"
          style={
            panelStyle
          }
        >
          <div className="flex h-full min-h-0 flex-col">
            <div
              className="flex cursor-grab touch-none select-none items-start justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-4 active:cursor-grabbing"
              onPointerDown={
                handlePanelPointerDown
              }
              onPointerMove={
                handlePanelPointerMove
              }
              onPointerUp={
                handlePanelPointerUp
              }
              onPointerCancel={() => {
                panelDragStartRef.current =
                  null;
              }}
            >
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wide text-zinc-500">
                  Q-Bit Editor
                </p>

                <h2 className="mt-1 truncate text-base font-black text-black">
                  {selectedDescriptor
                    ? friendlyTypeName(
                        selectedDescriptor.type
                      )
                    : "Global Appearance"}
                </h2>

                {selectedDescriptor && (
                  <>
                    <p className="mt-1 break-all text-[10px] font-semibold text-zinc-500">
                      ID:{" "}
                      {
                        selectedDescriptor.id
                      }
                    </p>

                    <p className="break-all text-[10px] font-semibold text-zinc-500">
                      Scope:{" "}
                      {
                        selectedDescriptor.scope
                      }
                    </p>
                  </>
                )}
              </div>

              <div
                className="flex shrink-0 gap-2"
                onPointerDown={(
                  event
                ) =>
                  event.stopPropagation()
                }
              >
                {selectedDescriptor && (
                  <button
                    type="button"
                    onClick={
                      cancelEditor
                    }
                    className={
                      secondaryButtonClass
                    }
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="button"
                  onClick={
                    handleResetAll
                  }
                  className={
                    secondaryButtonClass
                  }
                >
                  Reset
                </button>

                <button
                  type="button"
                  onClick={
                    closeEditor
                  }
                  className={
                    primaryButtonClass
                  }
                >
                  Save
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {selectedDescriptor ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-orange-300 bg-orange-50 p-3 text-xs font-bold leading-5 text-orange-800">
                    Editing this unique
                    element. Save or Cancel
                    before selecting another.
                  </div>

                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-wide text-zinc-500">
                      Descriptor
                    </p>

                    <div className="mt-2 grid gap-2 text-xs">
                      <div>
                        <span className="font-black">
                          Type:
                        </span>{" "}
                        {
                          selectedDescriptor.type
                        }
                      </div>

                      <div className="break-all">
                        <span className="font-black">
                          ID:
                        </span>{" "}
                        {
                          selectedDescriptor.id
                        }
                      </div>

                      <div className="break-all">
                        <span className="font-black">
                          Scope:
                        </span>{" "}
                        {
                          selectedDescriptor.scope
                        }
                      </div>
                    </div>
                  </div>

                  <label className="block">
                    <span
                      className={
                        fieldLabelClass
                      }
                    >
                      Background
                    </span>

                    <ColorSwatchPicker
                      value={
                        backgroundColor ||
                        "#ffffff"
                      }
                      onChange={(hex) =>
                        updateSelectedOverride({
                          backgroundColor:
                            hex,
                        })
                      }
                    />
                  </label>

                  <label className="block">
                    <span
                      className={
                        fieldLabelClass
                      }
                    >
                      Border
                    </span>

                    <ColorSwatchPicker
                      value={
                        borderColor ||
                        "#e4e4e7"
                      }
                      onChange={(hex) =>
                        updateSelectedOverride({
                          borderColor:
                            hex,
                        })
                      }
                    />
                  </label>

                  <label className="block">
                    <span
                      className={
                        fieldLabelClass
                      }
                    >
                      Text
                    </span>

                    <ColorSwatchPicker
                      value={
                        textColor ||
                        "#000000"
                      }
                      onChange={(hex) =>
                        updateSelectedOverride({
                          textColor:
                            hex,
                        })
                      }
                    />
                  </label>

                  {(selectedDescriptor.type ===
                    "tile" ||
                    selectedDescriptor.type ===
                      "page-card" ||
                    selectedDescriptor.type ===
                      "section") && (
                    <label className="block">
                      <span
                        className={
                          fieldLabelClass
                        }
                      >
                        3D Depth
                      </span>

                      <select
                        value={
                          depth
                        }
                        onChange={(
                          event
                        ) =>
                          updateSelectedOverride({
                            depth:
                              event.target
                                .value as ThreeDEffectLevel,
                          })
                        }
                        className={
                          inputClass
                        }
                      >
                        {threeDEffectOptions.map(
                          (option) => (
                            <option
                              key={
                                option
                              }
                              value={
                                option
                              }
                            >
                              {
                                option
                              }
                            </option>
                          )
                        )}
                      </select>
                    </label>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span
                        className={
                          fieldLabelClass
                        }
                      >
                        Width
                      </span>

                      <input
                        type="number"
                        min={
                          objectMinWidth
                        }
                        value={
                          selectedOverride?.width ??
                          Math.round(
                            activeRect?.width ??
                              0
                          )
                        }
                        onChange={(
                          event
                        ) =>
                          updateSelectedOverride({
                            width:
                              Number(
                                event.target
                                  .value
                              ),
                          })
                        }
                        className={
                          inputClass
                        }
                      />
                    </label>

                    <label className="block">
                      <span
                        className={
                          fieldLabelClass
                        }
                      >
                        Height
                      </span>

                      <input
                        type="number"
                        min={
                          objectMinHeight
                        }
                        value={
                          selectedOverride?.height ??
                          Math.round(
                            activeRect?.height ??
                              0
                          )
                        }
                        onChange={(
                          event
                        ) =>
                          updateSelectedOverride({
                            height:
                              Number(
                                event.target
                                  .value
                              ),
                          })
                        }
                        className={
                          inputClass
                        }
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span
                        className={
                          fieldLabelClass
                        }
                      >
                        X Offset
                      </span>

                      <input
                        type="number"
                        value={
                          selectedOverride?.offsetX ??
                          0
                        }
                        onChange={(
                          event
                        ) =>
                          updateSelectedOverride({
                            offsetX:
                              Number(
                                event.target
                                  .value
                              ),
                          })
                        }
                        className={
                          inputClass
                        }
                      />
                    </label>

                    <label className="block">
                      <span
                        className={
                          fieldLabelClass
                        }
                      >
                        Y Offset
                      </span>

                      <input
                        type="number"
                        value={
                          selectedOverride?.offsetY ??
                          0
                        }
                        onChange={(
                          event
                        ) =>
                          updateSelectedOverride({
                            offsetY:
                              Number(
                                event.target
                                  .value
                              ),
                          })
                        }
                        className={
                          inputClass
                        }
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span
                      className={
                        fieldLabelClass
                      }
                    >
                      Corner Radius
                    </span>

                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={
                        selectedOverride?.borderRadius ??
                        16
                      }
                      onChange={(
                        event
                      ) =>
                        updateSelectedOverride({
                          borderRadius:
                            Number(
                              event.target
                                .value
                            ),
                        })
                      }
                      className={
                        inputClass
                      }
                    />
                  </label>

                  {/* Windows-style text controls */}
                  <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-wide text-zinc-500">
                      Text
                    </p>

                    <label className="block">
                      <span className={fieldLabelClass}>
                        Font
                      </span>

                      <select
                        value={
                          selectedOverride?.fontFamily ??
                          "Inherit"
                        }
                        onChange={(event) =>
                          updateSelectedOverride({
                            fontFamily: event.target
                              .value as QBitFontFamily,
                          })
                        }
                        className={inputClass}
                      >
                        {qBitFontOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className={fieldLabelClass}>
                        Size
                      </span>

                      <input
                        type="number"
                        min={8}
                        max={96}
                        value={selectedOverride?.fontSize ?? 14}
                        onChange={(event) =>
                          updateSelectedOverride({
                            fontSize: Number(event.target.value),
                          })
                        }
                        className={inputClass}
                      />
                    </label>

                    <div>
                      <span className={fieldLabelClass}>
                        Style
                      </span>

                      <div className="mt-1 flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateSelectedOverride({
                              bold: !selectedOverride?.bold,
                            })
                          }
                          className={
                            selectedOverride?.bold
                              ? "flex-1 rounded-lg border border-orange-400 bg-orange-100 px-3 py-2 text-sm font-black text-orange-900"
                              : "flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-black text-black hover:bg-zinc-50"
                          }
                        >
                          B
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            updateSelectedOverride({
                              italic: !selectedOverride?.italic,
                            })
                          }
                          className={
                            selectedOverride?.italic
                              ? "flex-1 rounded-lg border border-orange-400 bg-orange-100 px-3 py-2 text-sm font-black italic text-orange-900"
                              : "flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-black italic text-black hover:bg-zinc-50"
                          }
                        >
                          I
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            updateSelectedOverride({
                              underline:
                                !selectedOverride?.underline,
                            })
                          }
                          className={
                            selectedOverride?.underline
                              ? "flex-1 rounded-lg border border-orange-400 bg-orange-100 px-3 py-2 text-sm font-black text-orange-900 underline"
                              : "flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-black text-black underline hover:bg-zinc-50"
                          }
                        >
                          U
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className={fieldLabelClass}>
                        Alignment
                      </span>

                      <div className="mt-1 flex gap-2">
                        {(
                          [
                            "left",
                            "center",
                            "right",
                          ] as QBitTextAlign[]
                        ).map((alignment) => (
                          <button
                            key={alignment}
                            type="button"
                            onClick={() =>
                              updateSelectedOverride({
                                textAlign: alignment,
                              })
                            }
                            className={
                              selectedOverride?.textAlign ===
                              alignment
                                ? "flex-1 rounded-lg border border-orange-400 bg-orange-100 px-2 py-2 text-[11px] font-black capitalize text-orange-900"
                                : "flex-1 rounded-lg border border-zinc-300 bg-white px-2 py-2 text-[11px] font-black capitalize text-black hover:bg-zinc-50"
                            }
                          >
                            {alignment}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Logo controls, wherever the logo actually appears */}
                  {selectionCarriesLogo && (
                    <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                      <button
                        type="button"
                        onClick={() =>
                          setLogoSectionOpen(
                            (current) => !current
                          )
                        }
                        className="flex w-full items-center justify-between rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-black text-black transition hover:bg-zinc-50"
                      >
                        <span>LOGO</span>
                        <span>
                          {logoSectionOpen ? "−" : "+"}
                        </span>
                      </button>

                      {logoSectionOpen && renderLogoControls()}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={
                      resetSelectedObject
                    }
                    className="w-full rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-100"
                  >
                    Reset This Element
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs font-semibold leading-5 text-zinc-700">
                    Double-click Q-Bit to
                    open global settings, or
                    click Q-Bit once and then
                    select an element.
                  </div>

                  <label className="block">
                    <span
                      className={
                        fieldLabelClass
                      }
                    >
                      Page Background
                    </span>

                    <ColorSwatchPicker
                      value={
                        settings.pageBackgroundColor
                      }
                      onChange={(hex) =>
                        updateSettings({
                          pageBackgroundColor:
                            hex,
                        })
                      }
                    />
                  </label>

                  <label className="block">
                    <span
                      className={
                        fieldLabelClass
                      }
                    >
                      Accent Color
                    </span>

                    <ColorSwatchPicker
                      value={
                        settings.accentColor
                      }
                      onChange={(hex) =>
                        updateSettings({
                          accentColor:
                            hex,
                        })
                      }
                    />
                  </label>

                  <label className="block">
                    <span
                      className={
                        fieldLabelClass
                      }
                    >
                      Global Text
                    </span>

                    <ColorSwatchPicker
                      value={
                        globalTextColor
                      }
                      onChange={
                        updateGlobalTextColor
                      }
                    />
                  </label>

                  <label className="block">
                    <span
                      className={
                        fieldLabelClass
                      }
                    >
                      Sidebar
                    </span>

                    <ColorSwatchPicker
                      value={
                        settings.sidebarBackgroundColor
                      }
                      onChange={(hex) =>
                        updateSettings({
                          sidebarBackgroundColor:
                            hex,
                        })
                      }
                    />
                  </label>

                  <label className="block">
                    <span
                      className={
                        fieldLabelClass
                      }
                    >
                      Sidebar Button
                    </span>

                    <ColorSwatchPicker
                      value={
                        settings.sidebarButtonColor
                      }
                      onChange={(hex) =>
                        updateSettings({
                          sidebarButtonColor:
                            hex,
                        })
                      }
                    />
                  </label>

                  <label className="block">
                    <span
                      className={
                        fieldLabelClass
                      }
                    >
                      Sidebar Button Text
                    </span>

                    <ColorSwatchPicker
                      value={
                        settings.sidebarButtonTextColor
                      }
                      onChange={(hex) =>
                        updateSettings({
                          sidebarButtonTextColor:
                            hex,
                        })
                      }
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span
                        className={
                          fieldLabelClass
                        }
                      >
                        Font
                      </span>

                      <select
                        value={
                          settings.fontFamily
                        }
                        onChange={(
                          event
                        ) =>
                          updateSettings({
                            fontFamily:
                              event.target
                                .value as AppearanceSettings["fontFamily"],
                          })
                        }
                        className={
                          inputClass
                        }
                      >
                        {fontFamilyOptions.map(
                          (option) => (
                            <option
                              key={
                                option
                              }
                              value={
                                option
                              }
                            >
                              {
                                option
                              }
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label className="block">
                      <span
                        className={
                          fieldLabelClass
                        }
                      >
                        Text Size
                      </span>

                      <select
                        value={
                          settings.fontSize
                        }
                        onChange={(
                          event
                        ) =>
                          updateSettings({
                            fontSize:
                              event.target
                                .value as AppearanceSettings["fontSize"],
                          })
                        }
                        className={
                          inputClass
                        }
                      >
                        {fontSizeOptions.map(
                          (option) => (
                            <option
                              key={
                                option
                              }
                              value={
                                option
                              }
                            >
                              {
                                option
                              }
                            </option>
                          )
                        )}
                      </select>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span
                        className={
                          fieldLabelClass
                        }
                      >
                        Tile Layout
                      </span>

                      <select
                        value={
                          settings.tileOrientation
                        }
                        onChange={(
                          event
                        ) =>
                          updateSettings({
                            tileOrientation:
                              event.target
                                .value as AppearanceSettings["tileOrientation"],
                          })
                        }
                        className={
                          inputClass
                        }
                      >
                        {tileOrientationOptions.map(
                          (option) => (
                            <option
                              key={
                                option
                              }
                              value={
                                option
                              }
                            >
                              {
                                option
                              }
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label className="block">
                      <span
                        className={
                          fieldLabelClass
                        }
                      >
                        Tile Size
                      </span>

                      <select
                        value={
                          settings.tileSize
                        }
                        onChange={(
                          event
                        ) =>
                          updateSettings({
                            tileSize:
                              event.target
                                .value as AppearanceSettings["tileSize"],
                          })
                        }
                        className={
                          inputClass
                        }
                      >
                        {tileSizeOptions.map(
                          (option) => (
                            <option
                              key={
                                option
                              }
                              value={
                                option
                              }
                            >
                              {
                                option
                              }
                            </option>
                          )
                        )}
                      </select>
                    </label>
                  </div>

                  {renderLogoControls()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {editorOpen &&
        selectedDescriptor &&
        activeRect !== null && (
          <div
            data-t1eq-qbit-selection-overlay="true"
            aria-hidden="true"
            className="pointer-events-none fixed z-[9999]"
            style={{
              top:
                activeRect.top,

              left:
                activeRect.left,

              width:
                activeRect.width,

              height:
                activeRect.height,

              background:
                "transparent",

              backgroundColor:
                "transparent",
            }}
          >
            {/* Top move edge */}
            <div
              title="Drag to move"
              onPointerDown={
                startObjectDrag
              }
              className="pointer-events-auto absolute -top-[3px] left-3 right-3 h-[6px] cursor-move bg-orange-500"
            />

            {/* Bottom move edge */}
            <div
              title="Drag to move"
              onPointerDown={
                startObjectDrag
              }
              className="pointer-events-auto absolute -bottom-[3px] left-3 right-3 h-[6px] cursor-move bg-orange-500"
            />

            {/* Left move edge */}
            <div
              title="Drag to move"
              onPointerDown={
                startObjectDrag
              }
              className="pointer-events-auto absolute bottom-3 -left-[3px] top-3 w-[6px] cursor-move bg-orange-500"
            />

            {/* Right move edge */}
            <div
              title="Drag to move"
              onPointerDown={
                startObjectDrag
              }
              className="pointer-events-auto absolute bottom-3 -right-[3px] top-3 w-[6px] cursor-move bg-orange-500"
            />

            {/* Top resize handle */}
            <div
              title="Resize height"
              onPointerDown={(event) =>
                startObjectResize(
                  event,
                  "top"
                )
              }
              className="pointer-events-auto absolute -top-[5px] left-1/2 h-[10px] w-16 -translate-x-1/2 cursor-ns-resize rounded-sm bg-orange-600"
            />

            {/* Bottom resize handle */}
            <div
              title="Resize height"
              onPointerDown={(event) =>
                startObjectResize(
                  event,
                  "bottom"
                )
              }
              className="pointer-events-auto absolute -bottom-[5px] left-1/2 h-[10px] w-16 -translate-x-1/2 cursor-ns-resize rounded-sm bg-orange-600"
            />

            {/* Left resize handle */}
            <div
              title="Resize width"
              onPointerDown={(event) =>
                startObjectResize(
                  event,
                  "left"
                )
              }
              className="pointer-events-auto absolute -left-[5px] top-1/2 h-16 w-[10px] -translate-y-1/2 cursor-ew-resize rounded-sm bg-orange-600"
            />

            {/* Right resize handle */}
            <div
              title="Resize width"
              onPointerDown={(event) =>
                startObjectResize(
                  event,
                  "right"
                )
              }
              className="pointer-events-auto absolute -right-[5px] top-1/2 h-16 w-[10px] -translate-y-1/2 cursor-ew-resize rounded-sm bg-orange-600"
            />

            {/* Top-left corner */}
            <div
              title="Resize"
              onPointerDown={(event) =>
                startObjectResize(
                  event,
                  "top-left"
                )
              }
              className="pointer-events-auto absolute -left-[6px] -top-[6px] h-3 w-3 cursor-nwse-resize rounded-sm border border-white bg-orange-600 shadow-sm"
            />

            {/* Top-right corner */}
            <div
              title="Resize"
              onPointerDown={(event) =>
                startObjectResize(
                  event,
                  "top-right"
                )
              }
              className="pointer-events-auto absolute -right-[6px] -top-[6px] h-3 w-3 cursor-nesw-resize rounded-sm border border-white bg-orange-600 shadow-sm"
            />

            {/* Bottom-left corner */}
            <div
              title="Resize"
              onPointerDown={(event) =>
                startObjectResize(
                  event,
                  "bottom-left"
                )
              }
              className="pointer-events-auto absolute -bottom-[6px] -left-[6px] h-3 w-3 cursor-nesw-resize rounded-sm border border-white bg-orange-600 shadow-sm"
            />

            {/* Bottom-right corner */}
            <div
              title="Resize"
              onPointerDown={(event) =>
                startObjectResize(
                  event,
                  "bottom-right"
                )
              }
              className="pointer-events-auto absolute -bottom-[6px] -right-[6px] h-3 w-3 cursor-nwse-resize rounded-sm border border-white bg-orange-600 shadow-sm"
            />
          </div>
        )}
    </>
  );
}