import {
  Application,
  Assets,
  Container,
  Graphics,
  Sprite,
  Texture,
} from "pixi.js";
import {
  ASPECT_RATIO_DIMENSIONS,
  DEFAULT_ASPECT_RATIO,
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
const ARTBOARD_RADIUS = 32;
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

type InteractionState =
  | {
      mode: "drag";
      itemId: string;
      startPointer: ArtboardPoint;
      startItem: CanvasItem;
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
  screenToCanvasPoint: (
    clientX: number,
    clientY: number,
  ) => NormalizedCanvasPoint | null;
  destroy: () => void;
}

interface CreateCanvasEditorOptions {
  onDocumentChange?: (document: EditorDocument) => void;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

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
  let currentRatio = DEFAULT_ASPECT_RATIO;
  let currentTool: EditorTool = "select";
  let currentBounds: ArtboardBounds = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };
  let selectedItemId: string | null = null;
  let interactionState: InteractionState = null;

  const getArtboardSize = () => ASPECT_RATIO_DIMENSIONS[currentRatio];

  const screenToArtboardPoint = (
    clientX: number,
    clientY: number,
    allowOutside = false,
  ): ArtboardPoint | null => {
    const rect = app.canvas.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) {
      return null;
    }

    const scaleX = app.screen.width / rect.width;
    const scaleY = app.screen.height / rect.height;
    const screenX = (clientX - rect.left) * scaleX;
    const screenY = (clientY - rect.top) * scaleY;

    if (
      !allowOutside &&
      (screenX < currentBounds.x ||
        screenY < currentBounds.y ||
        screenX > currentBounds.x + currentBounds.width ||
        screenY > currentBounds.y + currentBounds.height)
    ) {
      return null;
    }

    const { width, height } = getArtboardSize();

    return {
      x: ((screenX - currentBounds.x) / currentBounds.width) * width,
      y: ((screenY - currentBounds.y) / currentBounds.height) * height,
    };
  };

  const emitDocumentChange = () => {
    options.onDocumentChange?.(cloneDocument(currentDocument));
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
    const availableWidth = Math.max(app.screen.width - WORKSPACE_PADDING * 2, 120);
    const availableHeight = Math.max(app.screen.height - WORKSPACE_PADDING * 2, 120);
    const scale = Math.min(availableWidth / width, availableHeight / height);
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    const originX = (app.screen.width - scaledWidth) / 2;
    const originY = (app.screen.height - scaledHeight) / 2;

    currentBounds = {
      x: originX,
      y: originY,
      width: scaledWidth,
      height: scaledHeight,
    };

    workspace.clear();
    workspace
      .roundRect(0, 0, app.screen.width, app.screen.height, 0)
      .fill({ color: 0x0b1020 });

    shadow.clear();
    shadow
      .roundRect(originX + 10, originY + 14, scaledWidth, scaledHeight, ARTBOARD_RADIUS)
      .fill({ color: 0x020617, alpha: 0.2 });

    artboard.position.set(originX, originY);
    artboard.scale.set(scale);

    artboardBackground.clear();
    artboardBackground
      .roundRect(0, 0, width, height, ARTBOARD_RADIUS)
      .fill({ color: currentDocument.bg.fill })
      .stroke({ color: 0xd9dceb, width: 6 });

    renderItems();
    renderSelection();
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

  artboardBackground.on("pointerdown", () => {
    if (currentTool !== "select") {
      return;
    }

    selectedItemId = null;
    renderSelection();
  });

  workspace.on("pointerdown", () => {
    if (currentTool !== "select") {
      return;
    }

    selectedItemId = null;
    renderSelection();
  });

  const resizeObserver = new ResizeObserver(() => {
    renderScene();
  });

  resizeObserver.observe(container);
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
      currentRatio = ratio;
      renderScene();
    },
    setTool(tool) {
      currentTool = tool;

      if (tool !== "select") {
        selectedItemId = null;
        interactionState = null;
      }

      renderScene();
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
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      app.destroy({ removeView: true }, { children: true });
      container.replaceChildren();
    },
  };
};
