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
  DEFAULT_DOCUMENT,
  EFFECT_ASSETS,
  type AspectRatioPreset,
  type CanvasItem,
  type EditorCanvas,
  type EditorDocument,
  type EditorTool,
  findEffectAssetById,
  type NormalizedCanvasPoint,
} from "@/libs/editorSchema";

const WORKSPACE_PADDING = 72;
const ARTBOARD_GAP = 96;
const ARTBOARD_RADIUS = 0;
const MIN_ITEM_SIZE = 0.05;
const ROTATION_HANDLE_OFFSET = 44;
const HANDLE_RADIUS = 18;
const CANVAS_SNAP_THRESHOLD = 180;

interface ScreenPoint {
  x: number;
  y: number;
}

interface ArtboardPoint {
  x: number;
  y: number;
}

interface SelectionState {
  canvasId: string;
  itemId: string;
}

interface BoardArtboardLayout {
  canvasId: string;
  ratio: AspectRatioPreset;
  document: EditorDocument;
  worldX: number;
  worldY: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BoardLayout {
  artboards: BoardArtboardLayout[];
  centeredOriginX: number;
  centeredOriginY: number;
  minX: number;
  minY: number;
  fitHeight: number;
  fitWidth: number;
  scale: number;
  scaledHeight: number;
  scaledWidth: number;
  totalHeight: number;
  totalWidth: number;
}

export interface CanvasViewportState {
  canReturnToCanvas: boolean;
}

export interface CanvasPointerTarget {
  canvasId: string;
  point: NormalizedCanvasPoint;
}

type InteractionState =
  | {
      mode: "canvasMove";
      canvasId: string;
      startCanvasPosition: ScreenPoint;
      startPointer: ScreenPoint;
    }
  | {
      mode: "drag";
      canvasId: string;
      itemId: string;
      startPointer: ArtboardPoint;
      startItem: CanvasItem;
    }
  | {
      mode: "pan";
      startOffset: ScreenPoint;
      startPointer: ScreenPoint;
    }
  | {
      mode: "rotate";
      canvasId: string;
      itemId: string;
      startAngle: number;
      startItem: CanvasItem;
    }
  | {
      mode: "scale";
      canvasId: string;
      itemId: string;
      startDistance: number;
      startItem: CanvasItem;
    }
  | null;

export interface CanvasEditor {
  centerCanvas: () => void;
  destroy: () => void;
  screenToCanvasPoint: (
    clientX: number,
    clientY: number,
  ) => CanvasPointerTarget | null;
  setActiveCanvasId: (canvasId: string) => void;
  setCanvases: (canvases: EditorCanvas[]) => void;
  setTool: (tool: EditorTool) => void;
}

interface CreateCanvasEditorOptions {
  onActiveCanvasChange?: (canvasId: string) => void;
  onDocumentChange?: (canvasId: string, document: EditorDocument) => void;
  onViewportChange?: (state: CanvasViewportState) => void;
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

const cloneCanvas = (canvas: EditorCanvas): EditorCanvas => ({
  ...canvas,
  document: cloneDocument(canvas.document),
});

const degreesToRadians = (degrees: number) => (degrees * Math.PI) / 180;
const radiansToDegrees = (radians: number) => (radians * 180) / Math.PI;

const isPanPointerEvent = (event: PointerEvent | MouseEvent) =>
  event.button === 1 || (event.button === 0 && event.shiftKey);

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
  const shadows = new Graphics();
  const board = new Container();
  const selectionOverlay = new Container();
  const selectionBox = new Graphics();
  const rotateGuide = new Graphics();
  const rotateHandle = new Graphics();
  const scaleHandle = new Graphics();
  const textureCache = new Map<string, Texture>();

  selectionOverlay.addChild(selectionBox, rotateGuide, rotateHandle, scaleHandle);
  board.addChild(selectionOverlay);
  app.stage.addChild(workspace, shadows, board);

  await Promise.all(
    EFFECT_ASSETS.map(async (asset) => {
      const texture = await Assets.load<Texture>(asset.src);
      textureCache.set(asset.id, texture);
    }),
  );

  let currentCanvases: EditorCanvas[] = [
    {
      id: "canvas-1",
      ratio: "1:1",
      document: cloneDocument(DEFAULT_DOCUMENT),
    },
  ];
  let currentActiveCanvasId = currentCanvases[0].id;
  let currentTool: EditorTool = "select";
  let boardOrigin: ScreenPoint | null = null;
  let viewportZoom = 1;
  let currentLayout: BoardLayout = {
    artboards: [],
    centeredOriginX: 0,
    centeredOriginY: 0,
    fitHeight: 0,
    fitWidth: 0,
    minX: 0,
    minY: 0,
    scale: 1,
    scaledHeight: 0,
    scaledWidth: 0,
    totalHeight: 0,
    totalWidth: 0,
  };
  let interactionState: InteractionState = null;
  let selectedItem: SelectionState | null = null;
  const canvasPositions = new Map<string, ScreenPoint>();

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

  const getBoardLayout = (): BoardLayout => {
    const canvases = currentCanvases.length > 0 ? currentCanvases : [];

    if (canvases.length === 0) {
      return {
        artboards: [],
        centeredOriginX: app.screen.width / 2,
        centeredOriginY: app.screen.height / 2,
        fitHeight: 0,
        fitWidth: 0,
        minX: 0,
        minY: 0,
        scale: 1,
        scaledHeight: 0,
        scaledWidth: 0,
        totalHeight: 0,
        totalWidth: 0,
      };
    }

    let nextX = 0;

    if (canvasPositions.size > 0) {
      nextX = Math.max(
        ...canvases
          .filter((canvas) => canvasPositions.has(canvas.id))
          .map((canvas) => {
            const position = canvasPositions.get(canvas.id) ?? { x: 0, y: 0 };
            const size = ASPECT_RATIO_DIMENSIONS[canvas.ratio];

            return position.x + size.width + ARTBOARD_GAP;
          }),
      );
    }

    for (const canvas of canvases) {
      if (canvasPositions.has(canvas.id)) {
        continue;
      }

      canvasPositions.set(canvas.id, { x: nextX, y: 0 });
      nextX += ASPECT_RATIO_DIMENSIONS[canvas.ratio].width + ARTBOARD_GAP;
    }

    const sizes = canvases.map((canvas) => ({
      canvas,
      position: canvasPositions.get(canvas.id) ?? { x: 0, y: 0 },
      ...ASPECT_RATIO_DIMENSIONS[canvas.ratio],
    }));
    const fitWidth =
      sizes.reduce((sum, size) => sum + size.width, 0) +
      Math.max(sizes.length - 1, 0) * ARTBOARD_GAP;
    const fitHeight = Math.max(...sizes.map((size) => size.height));
    const minX = Math.min(...sizes.map((size) => size.position.x));
    const minY = Math.min(...sizes.map((size) => size.position.y));
    const maxX = Math.max(...sizes.map((size) => size.position.x + size.width));
    const maxY = Math.max(...sizes.map((size) => size.position.y + size.height));
    const totalWidth = maxX - minX;
    const totalHeight = maxY - minY;
    const artboards = sizes.map((entry) => ({
      canvasId: entry.canvas.id,
      ratio: entry.canvas.ratio,
      document: entry.canvas.document,
      worldX: entry.position.x,
      worldY: entry.position.y,
      x: entry.position.x,
      y: entry.position.y,
      width: entry.width,
      height: entry.height,
    }));
    const availableWidth = Math.max(app.screen.width - WORKSPACE_PADDING * 2, 120);
    const availableHeight = Math.max(app.screen.height - WORKSPACE_PADDING * 2, 120);
    const fitScale = Math.min(
      availableWidth / fitWidth,
      availableHeight / fitHeight,
    );
    const scale = fitScale * viewportZoom;
    const scaledWidth = totalWidth * scale;
    const scaledHeight = totalHeight * scale;

    return {
      artboards,
      centeredOriginX: (app.screen.width - fitWidth * scale) / 2,
      centeredOriginY: (app.screen.height - fitHeight * scale) / 2,
      fitHeight,
      fitWidth,
      minX,
      minY,
      scale,
      scaledHeight,
      scaledWidth,
      totalHeight,
      totalWidth,
    };
  };

  const getBoardOrigin = () =>
    boardOrigin ?? {
      x: currentLayout.centeredOriginX,
      y: currentLayout.centeredOriginY,
    };

  const getArtboardLayout = (canvasId: string) =>
    currentLayout.artboards.find((artboard) => artboard.canvasId === canvasId) ?? null;

  const getCanvasById = (canvasId: string) =>
    currentCanvases.find((canvas) => canvas.id === canvasId) ?? null;

  const syncCursor = () => {
    const cursor =
      interactionState?.mode === "pan" || interactionState?.mode === "canvasMove"
        ? "grabbing"
        : "default";

    workspace.cursor = cursor;
    board.cursor = cursor;
  };

  const emitViewportChange = () => {
    const origin = getBoardOrigin();
    const left = origin.x + currentLayout.minX * currentLayout.scale;
    const top = origin.y + currentLayout.minY * currentLayout.scale;
    const right = left + currentLayout.scaledWidth;
    const bottom = top + currentLayout.scaledHeight;

    options.onViewportChange?.({
      canReturnToCanvas:
        left < 0 ||
        top < 0 ||
        right > app.screen.width ||
        bottom > app.screen.height,
    });
  };

  const stageToBoardPoint = (point: ScreenPoint) => {
    const origin = getBoardOrigin();

    if (currentLayout.scale === 0) {
      return null;
    }

    return {
      x: (point.x - origin.x) / currentLayout.scale,
      y: (point.y - origin.y) / currentLayout.scale,
    };
  };

  const stageToWorldPoint = (point: ScreenPoint) => {
    const boardPoint = stageToBoardPoint(point);

    if (!boardPoint) {
      return null;
    }

    return boardPoint;
  };

  const getSnappedCanvasPosition = (
    canvasId: string,
    proposedPosition: ScreenPoint,
  ): ScreenPoint => {
    const canvas = getCanvasById(canvasId);

    if (!canvas) {
      return proposedPosition;
    }

    const movedSize = ASPECT_RATIO_DIMENSIONS[canvas.ratio];
    let bestPosition = proposedPosition;
    let bestDistance = CANVAS_SNAP_THRESHOLD;

    for (const otherCanvas of currentCanvases) {
      if (otherCanvas.id === canvasId) {
        continue;
      }

      const otherPosition = canvasPositions.get(otherCanvas.id) ?? { x: 0, y: 0 };
      const otherSize = ASPECT_RATIO_DIMENSIONS[otherCanvas.ratio];
      const candidates: ScreenPoint[] = [
        {
          x: otherPosition.x + otherSize.width + ARTBOARD_GAP,
          y: otherPosition.y,
        },
        {
          x: otherPosition.x - movedSize.width - ARTBOARD_GAP,
          y: otherPosition.y,
        },
        {
          x: otherPosition.x,
          y: otherPosition.y + otherSize.height + ARTBOARD_GAP,
        },
        {
          x: otherPosition.x,
          y: otherPosition.y - movedSize.height - ARTBOARD_GAP,
        },
      ];

      for (const candidate of candidates) {
        const distance = Math.hypot(
          proposedPosition.x - candidate.x,
          proposedPosition.y - candidate.y,
        );

        if (distance < bestDistance) {
          bestDistance = distance;
          bestPosition = candidate;
        }
      }
    }

    return bestPosition;
  };

  const stageToCanvasPoint = (
    point: ScreenPoint,
    canvasId?: string,
    allowOutside = false,
  ): CanvasPointerTarget | null => {
    const boardPoint = stageToBoardPoint(point);

    if (!boardPoint) {
      return null;
    }

    const artboards = canvasId
      ? currentLayout.artboards.filter((artboard) => artboard.canvasId === canvasId)
      : currentLayout.artboards;

    for (const artboard of artboards) {
      const localX = boardPoint.x - artboard.x;
      const localY = boardPoint.y - artboard.y;

      if (
        !allowOutside &&
        (localX < 0 ||
          localY < 0 ||
          localX > artboard.width ||
          localY > artboard.height)
      ) {
        continue;
      }

      return {
        canvasId: artboard.canvasId,
        point: {
          x: localX / artboard.width,
          y: localY / artboard.height,
        },
      };
    }

    return null;
  };

  const updateDocumentItem = (
    canvasId: string,
    itemId: string,
    updater: (item: CanvasItem) => CanvasItem,
  ) => {
    currentCanvases = currentCanvases.map((canvas) =>
      canvas.id !== canvasId
        ? canvas
        : {
            ...canvas,
            document: {
              ...canvas.document,
              items: canvas.document.items.map((item) =>
                item.id === itemId ? updater(item) : item,
              ),
            },
          },
    );
  };

  const emitDocumentChange = (canvasId: string) => {
    const canvas = getCanvasById(canvasId);

    if (!canvas) {
      return;
    }

    options.onDocumentChange?.(canvasId, cloneDocument(canvas.document));
  };

  const renderSelection = () => {
    selectionBox.clear();
    rotateGuide.clear();
    rotateHandle.clear();
    scaleHandle.clear();

    if (!selectedItem || currentTool !== "select") {
      return;
    }

    const selected = selectedItem;
    const artboard = getArtboardLayout(selected.canvasId);
    const canvas = getCanvasById(selected.canvasId);
    const item = canvas?.document.items.find((entry) => entry.id === selected.itemId);

    if (!artboard || !item) {
      selectedItem = null;
      return;
    }

    const itemWidth = item.w * artboard.width;
    const itemHeight = item.h * artboard.height;
    const halfWidth = itemWidth / 2;
    const halfHeight = itemHeight / 2;

    selectionOverlay.position.set(
      artboard.x + item.x * artboard.width,
      artboard.y + item.y * artboard.height,
    );
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

  const beginPan = (event: any) => {
    if (!isPanPointerEvent(event.originalEvent)) {
      return;
    }

    event.originalEvent.preventDefault();
    const point = screenToStagePoint(
      event.originalEvent.clientX,
      event.originalEvent.clientY,
    );

    if (!point) {
      return;
    }

    interactionState = {
      mode: "pan",
      startOffset: { ...getBoardOrigin() },
      startPointer: point,
    };
    syncCursor();
  };

  const beginCanvasMove = (canvasId: string, event: any) => {
    if (currentTool !== "select") {
      return;
    }

    const point = screenToStagePoint(
      event.originalEvent.clientX,
      event.originalEvent.clientY,
    );
    const worldPoint = point ? stageToWorldPoint(point) : null;
    const canvasPosition = canvasPositions.get(canvasId);

    if (!worldPoint || !canvasPosition) {
      return;
    }

    interactionState = {
      mode: "canvasMove",
      canvasId,
      startCanvasPosition: { ...canvasPosition },
      startPointer: worldPoint,
    };
    syncCursor();
  };

  const createArtboardPointerDown = (canvasId: string) => (event: any) => {
    if (isPanPointerEvent(event.originalEvent)) {
      beginPan(event);
      event.stopPropagation();
      return;
    }

    currentActiveCanvasId = canvasId;
    options.onActiveCanvasChange?.(canvasId);
    selectedItem = null;
    beginCanvasMove(canvasId, event);
    renderScene();
  };

  const renderScene = () => {
    currentLayout = getBoardLayout();

    if (!boardOrigin) {
      boardOrigin = {
        x: currentLayout.centeredOriginX,
        y: currentLayout.centeredOriginY,
      };
    }

    workspace.clear();
    workspace
      .roundRect(0, 0, app.screen.width, app.screen.height, 0)
      .fill({ color: 0x0b1020 });

    shadows.clear();
    board.removeChildren();
    board.addChild(selectionOverlay);

    const origin = getBoardOrigin();

    board.position.set(origin.x, origin.y);
    board.scale.set(currentLayout.scale);

    for (const artboard of currentLayout.artboards) {
      const artboardContainer = new Container();
      const background = new Graphics();
      const itemsLayer = new Container();
      const isActive = artboard.canvasId === currentActiveCanvasId;

      shadows
        .roundRect(
          origin.x + artboard.x * currentLayout.scale + 10,
          origin.y + artboard.y * currentLayout.scale + 12,
          artboard.width * currentLayout.scale,
          artboard.height * currentLayout.scale,
          ARTBOARD_RADIUS,
        )
        .fill({ color: 0x020617, alpha: isActive ? 0.22 : 0.14 });
      shadows
        .roundRect(
          origin.x + artboard.x * currentLayout.scale + 24,
          origin.y + artboard.y * currentLayout.scale + 30,
          artboard.width * currentLayout.scale - 8,
          artboard.height * currentLayout.scale - 8,
          ARTBOARD_RADIUS,
        )
        .fill({ color: 0x020617, alpha: isActive ? 0.12 : 0.06 });

      artboardContainer.position.set(artboard.x, artboard.y);
      background
        .roundRect(0, 0, artboard.width, artboard.height, ARTBOARD_RADIUS)
        .fill({ color: artboard.document.bg.fill });
      background.eventMode = "static";
      background.cursor = interactionState?.mode === "pan" ? "grabbing" : "default";
      background.on("pointerdown", createArtboardPointerDown(artboard.canvasId));

      for (const item of [...artboard.document.items].sort((left, right) => left.z - right.z)) {
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
        sprite.x = item.x * artboard.width;
        sprite.y = item.y * artboard.height;
        sprite.width = item.w * artboard.width;
        sprite.height = item.h * artboard.height;
        sprite.rotation = degreesToRadians(item.rotation);
        sprite.eventMode = "static";
        sprite.cursor = currentTool === "select" ? "move" : "default";
        sprite.on("pointerdown", (event: any) => {
          if (isPanPointerEvent(event.originalEvent)) {
            beginPan(event);
            event.stopPropagation();
            return;
          }

          currentActiveCanvasId = artboard.canvasId;
          options.onActiveCanvasChange?.(artboard.canvasId);

          if (currentTool !== "select") {
            renderScene();
            return;
          }

          const point = screenToStagePoint(
            event.originalEvent.clientX,
            event.originalEvent.clientY,
          );
          const target =
            point ? stageToCanvasPoint(point, artboard.canvasId, true) : null;

          if (!target) {
            return;
          }

          selectedItem = {
            canvasId: artboard.canvasId,
            itemId: item.id,
          };
          interactionState = {
            mode: "drag",
            canvasId: artboard.canvasId,
            itemId: item.id,
            startPointer: target.point,
            startItem: { ...item },
          };
          renderSelection();
          event.stopPropagation();
        });

        itemsLayer.addChild(sprite);
      }

      artboardContainer.addChild(background, itemsLayer);
      board.addChild(artboardContainer);
    }

    board.addChild(selectionOverlay);
    renderSelection();
    syncCursor();
    emitViewportChange();
  };

  const commitInteraction = (canvasId: string) => {
    renderScene();
    emitDocumentChange(canvasId);
  };

  const handlePointerMove = (event: PointerEvent) => {
    const activeInteraction = interactionState;

    if (!activeInteraction) {
      return;
    }

    if (activeInteraction.mode === "pan") {
      const stagePoint = screenToStagePoint(event.clientX, event.clientY);

      if (!stagePoint) {
        return;
      }

      boardOrigin = {
        x: activeInteraction.startOffset.x + stagePoint.x - activeInteraction.startPointer.x,
        y: activeInteraction.startOffset.y + stagePoint.y - activeInteraction.startPointer.y,
      };
      renderScene();
      return;
    }

    if (activeInteraction.mode === "canvasMove") {
      const stagePoint = screenToStagePoint(event.clientX, event.clientY);
      const worldPoint = stagePoint ? stageToWorldPoint(stagePoint) : null;

      if (!worldPoint) {
        return;
      }

      const proposedPosition = {
        x:
          activeInteraction.startCanvasPosition.x +
          worldPoint.x -
          activeInteraction.startPointer.x,
        y:
          activeInteraction.startCanvasPosition.y +
          worldPoint.y -
          activeInteraction.startPointer.y,
      };
      canvasPositions.set(
        activeInteraction.canvasId,
        getSnappedCanvasPosition(activeInteraction.canvasId, proposedPosition),
      );
      renderScene();
      return;
    }

    const stagePoint = screenToStagePoint(event.clientX, event.clientY);
    const target = stagePoint
      ? stageToCanvasPoint(stagePoint, activeInteraction.canvasId, true)
      : null;
    const artboard = getArtboardLayout(activeInteraction.canvasId);

    if (!target || !artboard) {
      return;
    }

    if (activeInteraction.mode === "drag") {
      const deltaX = target.point.x - activeInteraction.startPointer.x;
      const deltaY = target.point.y - activeInteraction.startPointer.y;
      const halfWidth = activeInteraction.startItem.w / 2;
      const halfHeight = activeInteraction.startItem.h / 2;

      updateDocumentItem(activeInteraction.canvasId, activeInteraction.itemId, (item) => ({
        ...item,
        x: clamp(activeInteraction.startItem.x + deltaX, halfWidth, 1 - halfWidth),
        y: clamp(activeInteraction.startItem.y + deltaY, halfHeight, 1 - halfHeight),
      }));
      commitInteraction(activeInteraction.canvasId);
      return;
    }

    if (activeInteraction.mode === "scale") {
      const centerX = activeInteraction.startItem.x * artboard.width;
      const centerY = activeInteraction.startItem.y * artboard.height;
      const pointerX = target.point.x * artboard.width;
      const pointerY = target.point.y * artboard.height;
      const distance = Math.hypot(pointerX - centerX, pointerY - centerY);
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

      updateDocumentItem(activeInteraction.canvasId, activeInteraction.itemId, (item) => ({
        ...item,
        w: clamp(rawWidth, MIN_ITEM_SIZE, maxWidth),
        h: clamp(rawHeight, MIN_ITEM_SIZE, maxHeight),
      }));
      commitInteraction(activeInteraction.canvasId);
      return;
    }

    const centerX = activeInteraction.startItem.x * artboard.width;
    const centerY = activeInteraction.startItem.y * artboard.height;
    const pointerX = target.point.x * artboard.width;
    const pointerY = target.point.y * artboard.height;
    const angle = Math.atan2(pointerY - centerY, pointerX - centerX);
    const rotation =
      activeInteraction.startItem.rotation +
      radiansToDegrees(angle - activeInteraction.startAngle);

    updateDocumentItem(activeInteraction.canvasId, activeInteraction.itemId, (item) => ({
      ...item,
      rotation,
    }));
    commitInteraction(activeInteraction.canvasId);
  };

  const handlePointerUp = () => {
    if (!interactionState) {
      return;
    }

    interactionState = null;
    syncCursor();
  };

  const centerCanvas = () => {
    boardOrigin = {
      x: (app.screen.width - currentLayout.scaledWidth) / 2 - currentLayout.minX * currentLayout.scale,
      y: (app.screen.height - currentLayout.scaledHeight) / 2 - currentLayout.minY * currentLayout.scale,
    };
    renderScene();
  };

  const handleWheel = (event: WheelEvent) => {
    event.preventDefault();

    const pointer = screenToStagePoint(event.clientX, event.clientY);

    if (!pointer || currentLayout.scale === 0) {
      return;
    }

    const origin = getBoardOrigin();
    const boardPoint = {
      x: (pointer.x - origin.x) / currentLayout.scale,
      y: (pointer.y - origin.y) / currentLayout.scale,
    };
    const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9;
    const nextZoom = clamp(viewportZoom * zoomFactor, 0.2, 4);

    if (nextZoom === viewportZoom) {
      return;
    }

    viewportZoom = nextZoom;

    const nextLayout = getBoardLayout();

    boardOrigin = {
      x: pointer.x - boardPoint.x * nextLayout.scale,
      y: pointer.y - boardPoint.y * nextLayout.scale,
    };
    renderScene();
  };

  selectionOverlay.eventMode = "passive";
  rotateHandle.eventMode = "static";
  rotateHandle.cursor = "grab";
  scaleHandle.eventMode = "static";
  scaleHandle.cursor = "nwse-resize";
  workspace.eventMode = "static";

  rotateHandle.on("pointerdown", (event: any) => {
    if (!selectedItem) {
      return;
    }

    const selected = selectedItem;

    if (isPanPointerEvent(event.originalEvent)) {
      beginPan(event);
      event.stopPropagation();
      return;
    }

    const artboard = getArtboardLayout(selected.canvasId);
    const canvas = getCanvasById(selected.canvasId);
    const item = canvas?.document.items.find((entry) => entry.id === selected.itemId);
    const point = screenToStagePoint(
      event.originalEvent.clientX,
      event.originalEvent.clientY,
    );
    const target = point ? stageToCanvasPoint(point, selected.canvasId, true) : null;

    if (!artboard || !item || !target) {
      return;
    }

    const centerX = item.x * artboard.width;
    const centerY = item.y * artboard.height;

    interactionState = {
      mode: "rotate",
      canvasId: selected.canvasId,
      itemId: selected.itemId,
      startAngle: Math.atan2(
        target.point.y * artboard.height - centerY,
        target.point.x * artboard.width - centerX,
      ),
      startItem: { ...item },
    };
    event.stopPropagation();
  });

  scaleHandle.on("pointerdown", (event: any) => {
    if (!selectedItem) {
      return;
    }

    const selected = selectedItem;

    if (isPanPointerEvent(event.originalEvent)) {
      beginPan(event);
      event.stopPropagation();
      return;
    }

    const artboard = getArtboardLayout(selected.canvasId);
    const canvas = getCanvasById(selected.canvasId);
    const item = canvas?.document.items.find((entry) => entry.id === selected.itemId);
    const point = screenToStagePoint(
      event.originalEvent.clientX,
      event.originalEvent.clientY,
    );
    const target = point ? stageToCanvasPoint(point, selected.canvasId, true) : null;

    if (!artboard || !item || !target) {
      return;
    }

    const centerX = item.x * artboard.width;
    const centerY = item.y * artboard.height;

    interactionState = {
      mode: "scale",
      canvasId: selected.canvasId,
      itemId: selected.itemId,
      startDistance: Math.hypot(
        target.point.x * artboard.width - centerX,
        target.point.y * artboard.height - centerY,
      ),
      startItem: { ...item },
    };
    event.stopPropagation();
  });

  workspace.on("pointerdown", (event: any) => {
    if (!isPanPointerEvent(event.originalEvent)) {
      selectedItem = null;
      renderSelection();
      return;
    }

    beginPan(event);
  });

  const resizeObserver = new ResizeObserver(() => {
    renderScene();
  });

  resizeObserver.observe(container);
  app.canvas.addEventListener("wheel", handleWheel, { passive: false });
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerUp);
  renderScene();

  return {
    centerCanvas() {
      centerCanvas();
    },
    destroy() {
      resizeObserver.disconnect();
      app.canvas.removeEventListener("wheel", handleWheel);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      app.destroy({ removeView: true }, { children: true });
      container.replaceChildren();
    },
    screenToCanvasPoint(clientX, clientY) {
      const point = screenToStagePoint(clientX, clientY);

      return point ? stageToCanvasPoint(point, undefined, false) : null;
    },
    setActiveCanvasId(canvasId) {
      currentActiveCanvasId = canvasId;
      renderScene();
    },
    setCanvases(canvases) {
      currentCanvases = canvases.map((canvas) => cloneCanvas(canvas));
      const selected = selectedItem;
      const activeIds = new Set(currentCanvases.map((canvas) => canvas.id));

      for (const canvasId of Array.from(canvasPositions.keys())) {
        if (!activeIds.has(canvasId)) {
          canvasPositions.delete(canvasId);
        }
      }

      if (!currentCanvases.some((canvas) => canvas.id === currentActiveCanvasId)) {
        currentActiveCanvasId = currentCanvases[0]?.id ?? "";
      }

      if (
        selected &&
        !currentCanvases.some(
          (canvas) =>
            canvas.id === selected.canvasId &&
            canvas.document.items.some((item) => item.id === selected.itemId),
        )
      ) {
        selectedItem = null;
      }

      renderScene();
    },
    setTool(tool) {
      currentTool = tool;

      if (tool !== "select") {
        selectedItem = null;
        interactionState = null;
      }

      renderScene();
    },
  };
};
