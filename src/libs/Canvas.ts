import {
  Application,
  Assets,
  Container,
  Graphics,
  Sprite,
  Texture,
} from "pixi.js";
import {
  DEFAULT_DOCUMENT,
  EFFECT_ASSETS,
  type AspectRatioPreset,
  type CanvasItem,
  type EditorDocument,
  type EditorTool,
  findEffectAssetById,
  type NormalizedCanvasPoint,
} from "@/libs/editorSchema";

const WORKSPACE_PADDING = 72;
const ARTBOARD_SIZE = 1200;
const ARTBOARD_RADIUS = 0;
const MIN_ITEM_SIZE = 0.05;
const ROTATION_HANDLE_OFFSET = 44;
const HANDLE_RADIUS = 18;

interface ArtboardBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ArtboardPoint {
  x: number;
  y: number;
}

interface ScreenPoint {
  x: number;
  y: number;
}

export interface CanvasViewportState {
  canReturnToCanvas: boolean;
}

type InteractionState =
  | {
      mode: "drag";
      itemId: string;
      startPointer: ArtboardPoint;
      startItem: CanvasItem;
    }
  | {
      mode: "pan";
      startPointer: ScreenPoint;
      startOffset: ScreenPoint;
    }
  | {
      mode: "scale";
      itemId: string;
      startDistance: number;
      startItem: CanvasItem;
    }
  | {
      mode: "rotate";
      itemId: string;
      startAngle: number;
      startItem: CanvasItem;
    }
  | null;

export interface CanvasEditor {
  setDocument: (document: EditorDocument) => void;
  setAspectRatio: (ratio: AspectRatioPreset) => void;
  setTool: (tool: EditorTool) => void;
  centerCanvas: () => void;
  screenToCanvasPoint: (
    clientX: number,
    clientY: number,
  ) => NormalizedCanvasPoint | null;
  destroy: () => void;
}

interface CreateCanvasEditorOptions {
  onDocumentChange?: (document: EditorDocument) => void;
  onViewportChange?: (state: CanvasViewportState) => void;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const isPanPointerEvent = (event: PointerEvent | MouseEvent) =>
  event.button === 1 || (event.button === 0 && event.shiftKey);

const cloneDocument = (document: EditorDocument): EditorDocument => ({
  v: 1,
  bg: {
    fill: document.bg.fill,
  },
  items: document.items.map((item) => ({ ...item })),
});

const degreesToRadians = (degrees: number) => (degrees * Math.PI) / 180;
const radiansToDegrees = (radians: number) => (radians * 180) / Math.PI;

export const createCanvasEditor = async (
  container: HTMLElement,
  options: CreateCanvasEditorOptions = {},
): Promise<CanvasEditor> => {
  const app = new Application();

  await app.init({
    antialias: true,
    autoDensity: true,
    backgroundAlpha: 0,
    resizeTo: container,
  });

  container.replaceChildren();
  container.appendChild(app.canvas);
  app.canvas.style.touchAction = "none";

  const workspace = new Graphics();
  const shadow = new Graphics();
  const artboard = new Container();
  const artboardBackground = new Graphics();
  const itemsLayer = new Container();
  const selectionOverlay = new Container();
  const selectionBox = new Graphics();
  const rotateGuide = new Graphics();
  const rotateHandle = new Graphics();
  const scaleHandle = new Graphics();
  const textureCache = new Map<string, Texture>();

  selectionOverlay.addChild(selectionBox, rotateGuide, rotateHandle, scaleHandle);
  artboard.addChild(artboardBackground, itemsLayer, selectionOverlay);
  app.stage.addChild(workspace, shadow, artboard);

  await Promise.all(
    EFFECT_ASSETS.map(async (asset) => {
      const texture = await Assets.load<Texture>(asset.src);
      textureCache.set(asset.id, texture);
    }),
  );

  let currentDocument = cloneDocument(DEFAULT_DOCUMENT);
  let currentTool: EditorTool = "select";
  let currentBounds: ArtboardBounds = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };
  let artboardOffset: ScreenPoint = {
    x: 0,
    y: 0,
  };
  let viewportZoom = 1;
  let selectedItemId: string | null = null;
  let interactionState: InteractionState = null;

  const getArtboardSize = () => ({
    width: ARTBOARD_SIZE,
    height: ARTBOARD_SIZE,
  });

  const screenToStagePoint = (
    clientX: number,
    clientY: number,
  ): ScreenPoint | null => {
    const rect = app.canvas.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) {
      return null;
    }

    return {
      x: (clientX - rect.left) * (app.screen.width / rect.width),
      y: (clientY - rect.top) * (app.screen.height / rect.height),
    };
  };

  const getArtboardLayout = () => {
    const availableWidth = Math.max(app.screen.width - WORKSPACE_PADDING * 2, 120);
    const availableHeight = Math.max(app.screen.height - WORKSPACE_PADDING * 2, 120);
    const fitScale = Math.min(
      availableWidth / ARTBOARD_SIZE,
      availableHeight / ARTBOARD_SIZE,
    );
    const scale = fitScale * viewportZoom;
    const scaledSize = ARTBOARD_SIZE * scale;
    const centeredOriginX = (app.screen.width - scaledSize) / 2;
    const centeredOriginY = (app.screen.height - scaledSize) / 2;

    return {
      scale,
      fitScale,
      scaledSize,
      centeredOriginX,
      centeredOriginY,
    };
  };

  const syncWorkspaceCursor = () => {
    const isPanActive = interactionState?.mode === "pan";
    const cursor = isPanActive ? "grabbing" : "default";

    workspace.cursor = cursor;
    artboardBackground.cursor = cursor;
  };

  const screenToArtboardPoint = (
    clientX: number,
    clientY: number,
    allowOutside = false,
  ): ArtboardPoint | null => {
    const point = screenToStagePoint(clientX, clientY);

    if (!point) {
      return null;
    }

    if (
      !allowOutside &&
      (point.x < currentBounds.x ||
        point.y < currentBounds.y ||
        point.x > currentBounds.x + currentBounds.width ||
        point.y > currentBounds.y + currentBounds.height)
    ) {
      return null;
    }

    const { width, height } = getArtboardSize();

    return {
      x: ((point.x - currentBounds.x) / currentBounds.width) * width,
      y: ((point.y - currentBounds.y) / currentBounds.height) * height,
    };
  };

  const emitDocumentChange = () => {
    options.onDocumentChange?.(cloneDocument(currentDocument));
  };

  const emitViewportChange = () => {
    const right = currentBounds.x + currentBounds.width;
    const bottom = currentBounds.y + currentBounds.height;

    options.onViewportChange?.({
      canReturnToCanvas:
        currentBounds.x < 0 ||
        currentBounds.y < 0 ||
        right > app.screen.width ||
        bottom > app.screen.height,
    });
  };

  const updateDocumentItem = (
    itemId: string,
    updater: (item: CanvasItem) => CanvasItem,
  ) => {
    currentDocument = {
      ...currentDocument,
      items: currentDocument.items.map((item) =>
        item.id === itemId ? updater(item) : item,
      ),
    };
  };

  const renderSelection = () => {
    selectionBox.clear();
    rotateGuide.clear();
    rotateHandle.clear();
    scaleHandle.clear();

    if (!selectedItemId || currentTool !== "select") {
      return;
    }

    const { width, height } = getArtboardSize();
    const item = currentDocument.items.find((entry) => entry.id === selectedItemId);

    if (!item) {
      selectedItemId = null;
      return;
    }

    const itemWidth = item.w * width;
    const itemHeight = item.h * height;
    const halfWidth = itemWidth / 2;
    const halfHeight = itemHeight / 2;

    selectionOverlay.visible = true;
    selectionOverlay.position.set(item.x * width, item.y * height);
    selectionOverlay.rotation = degreesToRadians(item.rotation);

    selectionBox
      .roundRect(-halfWidth, -halfHeight, itemWidth, itemHeight, 24)
      .stroke({ color: 0x10b981, width: 6 });

    rotateGuide
      .moveTo(0, -halfHeight)
      .lineTo(0, -halfHeight - ROTATION_HANDLE_OFFSET)
      .stroke({ color: 0x10b981, width: 4 });

    rotateHandle
      .circle(0, -halfHeight - ROTATION_HANDLE_OFFSET, HANDLE_RADIUS)
      .fill({ color: 0x10b981 })
      .stroke({ color: 0xffffff, width: 4 });

    scaleHandle
      .circle(halfWidth, halfHeight, HANDLE_RADIUS)
      .fill({ color: 0x10b981 })
      .stroke({ color: 0xffffff, width: 4 });
  };

  const renderItems = () => {
    const { width, height } = getArtboardSize();

    for (const child of itemsLayer.removeChildren()) {
      child.destroy();
    }

    const items = [...currentDocument.items].sort((left, right) => left.z - right.z);

    for (const item of items) {
      const asset = findEffectAssetById(item.sourceId);

      if (!asset) {
        continue;
      }

      const texture = textureCache.get(asset.id);

      if (!texture) {
        continue;
      }

      const sprite = new Sprite(texture);

      sprite.anchor.set(0.5);
      sprite.x = item.x * width;
      sprite.y = item.y * height;
      sprite.width = item.w * width;
      sprite.height = item.h * height;
      sprite.rotation = degreesToRadians(item.rotation);
      sprite.eventMode = "static";
      sprite.cursor = currentTool === "select" ? "move" : "default";

      sprite.on("pointerdown", (event: any) => {
        if (isPanPointerEvent(event.originalEvent)) {
          beginPan(event);
          event.stopPropagation();
          return;
        }

        if (currentTool !== "select") {
          return;
        }

        const pointer = screenToArtboardPoint(
          event.originalEvent.clientX,
          event.originalEvent.clientY,
          true,
        );

        if (!pointer) {
          return;
        }

        selectedItemId = item.id;
        interactionState = {
          mode: "drag",
          itemId: item.id,
          startPointer: pointer,
          startItem: { ...item },
        };
        renderSelection();
        event.stopPropagation();
      });

      itemsLayer.addChild(sprite);
    }
  };

  const renderScene = () => {
    const { width, height } = getArtboardSize();
    const layout = getArtboardLayout();

    const originX = layout.centeredOriginX + artboardOffset.x;
    const originY = layout.centeredOriginY + artboardOffset.y;

    currentBounds = {
      x: originX,
      y: originY,
      width: layout.scaledSize,
      height: layout.scaledSize,
    };

    workspace.clear();
    workspace
      .roundRect(0, 0, app.screen.width, app.screen.height, 0)
      .fill({ color: 0x0b1020 });

    shadow.clear();
    shadow
      .roundRect(originX + 10, originY + 12, layout.scaledSize, layout.scaledSize, ARTBOARD_RADIUS)
      .fill({ color: 0x020617, alpha: 0.16 });
    shadow
      .roundRect(originX + 24, originY + 30, layout.scaledSize - 8, layout.scaledSize - 8, ARTBOARD_RADIUS)
      .fill({ color: 0x020617, alpha: 0.08 });

    artboard.position.set(originX, originY);
    artboard.scale.set(layout.scale);

    artboardBackground.clear();
    artboardBackground
      .roundRect(0, 0, width, height, ARTBOARD_RADIUS)
      .fill({ color: currentDocument.bg.fill });

    renderItems();
    renderSelection();
    syncWorkspaceCursor();
    emitViewportChange();
  };

  const commitInteraction = () => {
    renderScene();
    emitDocumentChange();
  };

  const handlePointerMove = (event: PointerEvent) => {
    const activeInteraction = interactionState;

    if (!activeInteraction) {
      return;
    }

    const point = screenToArtboardPoint(event.clientX, event.clientY, true);

    if (!point) {
      return;
    }

    if (activeInteraction.mode === "pan") {
      const stagePoint = screenToStagePoint(event.clientX, event.clientY);

      if (!stagePoint) {
        return;
      }

      artboardOffset = {
        x: activeInteraction.startOffset.x + stagePoint.x - activeInteraction.startPointer.x,
        y: activeInteraction.startOffset.y + stagePoint.y - activeInteraction.startPointer.y,
      };
      renderScene();
      return;
    }

    const { width, height } = getArtboardSize();

    if (activeInteraction.mode === "drag") {
      const deltaX = (point.x - activeInteraction.startPointer.x) / width;
      const deltaY = (point.y - activeInteraction.startPointer.y) / height;
      const nextWidth = activeInteraction.startItem.w;
      const nextHeight = activeInteraction.startItem.h;
      const halfWidth = nextWidth / 2;
      const halfHeight = nextHeight / 2;

      updateDocumentItem(activeInteraction.itemId, (item) => ({
        ...item,
        x: clamp(activeInteraction.startItem.x + deltaX, halfWidth, 1 - halfWidth),
        y: clamp(activeInteraction.startItem.y + deltaY, halfHeight, 1 - halfHeight),
      }));
      commitInteraction();
      return;
    }

    if (activeInteraction.mode === "scale") {
      const centerX = activeInteraction.startItem.x * width;
      const centerY = activeInteraction.startItem.y * height;
      const distance = Math.hypot(point.x - centerX, point.y - centerY);
      const ratio = distance / Math.max(activeInteraction.startDistance, 24);
      const rawWidth = activeInteraction.startItem.w * ratio;
      const rawHeight = activeInteraction.startItem.h * ratio;
      const maxWidth = Math.max(
        MIN_ITEM_SIZE,
        Math.min(activeInteraction.startItem.x, 1 - activeInteraction.startItem.x) * 2,
      );
      const maxHeight = Math.max(
        MIN_ITEM_SIZE,
        Math.min(activeInteraction.startItem.y, 1 - activeInteraction.startItem.y) * 2,
      );

      updateDocumentItem(activeInteraction.itemId, (item) => ({
        ...item,
        w: clamp(rawWidth, MIN_ITEM_SIZE, maxWidth),
        h: clamp(rawHeight, MIN_ITEM_SIZE, maxHeight),
      }));
      commitInteraction();
      return;
    }

    const centerX = activeInteraction.startItem.x * width;
    const centerY = activeInteraction.startItem.y * height;
    const angle = Math.atan2(point.y - centerY, point.x - centerX);
    const rotation =
      activeInteraction.startItem.rotation +
      radiansToDegrees(angle - activeInteraction.startAngle);

    updateDocumentItem(activeInteraction.itemId, (item) => ({
      ...item,
      rotation,
    }));
    commitInteraction();
  };

  const handlePointerUp = () => {
    if (!interactionState) {
      return;
    }

    interactionState = null;
    syncWorkspaceCursor();
  };

  const centerCanvas = () => {
    artboardOffset = { x: 0, y: 0 };
    renderScene();
  };

  const handleWheel = (event: WheelEvent) => {
    event.preventDefault();

    const pointer = screenToStagePoint(event.clientX, event.clientY);

    if (!pointer) {
      return;
    }

    const previousLayout = getArtboardLayout();
    const previousOriginX = previousLayout.centeredOriginX + artboardOffset.x;
    const previousOriginY = previousLayout.centeredOriginY + artboardOffset.y;
    const localX = (pointer.x - previousOriginX) / previousLayout.scaledSize;
    const localY = (pointer.y - previousOriginY) / previousLayout.scaledSize;
    const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9;
    const nextZoom = clamp(viewportZoom * zoomFactor, 0.2, 4);

    if (nextZoom === viewportZoom) {
      return;
    }

    viewportZoom = nextZoom;

    const nextLayout = getArtboardLayout();

    artboardOffset = {
      x: pointer.x - localX * nextLayout.scaledSize - nextLayout.centeredOriginX,
      y: pointer.y - localY * nextLayout.scaledSize - nextLayout.centeredOriginY,
    };
    renderScene();
  };

  selectionOverlay.eventMode = "passive";
  rotateHandle.eventMode = "static";
  rotateHandle.cursor = "grab";
  scaleHandle.eventMode = "static";
  scaleHandle.cursor = "nwse-resize";
  artboardBackground.eventMode = "static";
  workspace.eventMode = "static";

  rotateHandle.on("pointerdown", (event: any) => {
    if (currentTool !== "select" || !selectedItemId) {
      return;
    }

    if (isPanPointerEvent(event.originalEvent)) {
      beginPan(event);
      event.stopPropagation();
      return;
    }

    const item = currentDocument.items.find((entry) => entry.id === selectedItemId);
    const pointer = screenToArtboardPoint(
      event.originalEvent.clientX,
      event.originalEvent.clientY,
      true,
    );

    if (!item || !pointer) {
      return;
    }

    const { width, height } = getArtboardSize();

    interactionState = {
      mode: "rotate",
      itemId: item.id,
      startAngle: Math.atan2(pointer.y - item.y * height, pointer.x - item.x * width),
      startItem: { ...item },
    };
    event.stopPropagation();
  });

  scaleHandle.on("pointerdown", (event: any) => {
    if (currentTool !== "select" || !selectedItemId) {
      return;
    }

    if (isPanPointerEvent(event.originalEvent)) {
      beginPan(event);
      event.stopPropagation();
      return;
    }

    const item = currentDocument.items.find((entry) => entry.id === selectedItemId);
    const pointer = screenToArtboardPoint(
      event.originalEvent.clientX,
      event.originalEvent.clientY,
      true,
    );

    if (!item || !pointer) {
      return;
    }

    const { width, height } = getArtboardSize();
    const centerX = item.x * width;
    const centerY = item.y * height;

    interactionState = {
      mode: "scale",
      itemId: item.id,
      startDistance: Math.hypot(pointer.x - centerX, pointer.y - centerY),
      startItem: { ...item },
    };
    event.stopPropagation();
  });

  const beginPan = (event: any) => {
    if (!isPanPointerEvent(event.originalEvent)) {
      return;
    }

    event.originalEvent.preventDefault();

    const stagePoint = screenToStagePoint(
      event.originalEvent.clientX,
      event.originalEvent.clientY,
    );

    if (!stagePoint) {
      return;
    }

    selectedItemId = null;
    interactionState = {
      mode: "pan",
      startPointer: stagePoint,
      startOffset: { ...artboardOffset },
    };
    syncWorkspaceCursor();
    renderSelection();
  };

  artboardBackground.on("pointerdown", beginPan);
  workspace.on("pointerdown", beginPan);

  const resizeObserver = new ResizeObserver(() => {
    renderScene();
  });

  resizeObserver.observe(container);
  app.canvas.addEventListener("wheel", handleWheel, { passive: false });
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerUp);
  renderScene();

  return {
    setDocument(document) {
      currentDocument = cloneDocument(document);

      if (
        selectedItemId &&
        !currentDocument.items.some((item) => item.id === selectedItemId)
      ) {
        selectedItemId = null;
      }

      renderScene();
    },
    setAspectRatio(ratio) {
      void ratio;
    },
    setTool(tool) {
      currentTool = tool;

      if (tool !== "select") {
        selectedItemId = null;
        interactionState = null;
      }

      renderScene();
    },
    centerCanvas() {
      centerCanvas();
    },
    screenToCanvasPoint(clientX, clientY) {
      const point = screenToArtboardPoint(clientX, clientY, false);
      const { width, height } = getArtboardSize();

      if (!point) {
        return null;
      }

      return {
        x: point.x / width,
        y: point.y / height,
      };
    },
    destroy() {
      resizeObserver.disconnect();
      app.canvas.removeEventListener("wheel", handleWheel);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      app.destroy({ removeView: true }, { children: true });
      container.replaceChildren();
    },
  };
};
