import { Texture } from "pixi.js";

const textureCache = new Map<string, Texture>();
const texturePromises = new Map<string, Promise<Texture>>();

const splitCssArgs = (value: string) => {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;

  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];

    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;

    if (char === "," && depth === 0) {
      parts.push(value.slice(start, i).trim());
      start = i + 1;
    }
  }

  parts.push(value.slice(start).trim());
  return parts;
};

const parseCssImageBackground = (background: string | undefined) => {
  if (!background?.startsWith("url(")) return null;

  const match = background.match(/^url\((?:"([^"]+)"|'([^']+)'|([^)]*))\)/);
  const src = match?.[1] ?? match?.[2] ?? match?.[3]?.trim();

  return src ? { src } : null;
};

const addGradientStops = (gradient: CanvasGradient, stops: string[]) => {
  stops.forEach((stop, index) => {
    const stopMatch = stop.match(/^(.*)\s+([\d.]+)%$/);

    gradient.addColorStop(
      stopMatch
        ? Number(stopMatch[2]) / 100
        : index / Math.max(1, stops.length - 1),
      stopMatch ? stopMatch[1] : stop,
    );
  });
};

const createFillStyle = (
  context: CanvasRenderingContext2D,
  background: string | undefined,
  width: number,
  height: number,
) => {
  if (!background) return "#f8fafc";
  if (parseCssImageBackground(background)) return "#f8fafc";

  if (background.startsWith("linear-gradient(")) {
    const args = splitCssArgs(background.slice(16, -1));
    const angleMatch = args[0]?.match(/^([\d.]+)deg$/);
    const angle = ((angleMatch ? Number(angleMatch[1]) : 180) * Math.PI) / 180;
    const dx = Math.sin(angle);
    const dy = -Math.cos(angle);
    const length = Math.abs(width * dx) + Math.abs(height * dy);
    const gradient = context.createLinearGradient(
      width / 2 - (dx * length) / 2,
      height / 2 - (dy * length) / 2,
      width / 2 + (dx * length) / 2,
      height / 2 + (dy * length) / 2,
    );

    addGradientStops(gradient, args.slice(angleMatch ? 1 : 0));
    return gradient;
  }

  if (background.startsWith("radial-gradient(")) {
    const args = splitCssArgs(background.slice(16, -1));
    const shape = args[0] ?? "";
    const positionMatch = shape.match(/at\s+([\d.]+)%\s+([\d.]+)%/);
    const hasShapeArg =
      shape.startsWith("circle") ||
      shape.startsWith("ellipse") ||
      shape.startsWith("at ");
    const centerX = width * (positionMatch ? Number(positionMatch[1]) / 100 : 0.5);
    const centerY = height * (positionMatch ? Number(positionMatch[2]) / 100 : 0.5);
    const radius = Math.max(width, height);
    const gradient = context.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      radius,
    );

    addGradientStops(gradient, args.slice(hasShapeArg ? 1 : 0));
    return gradient;
  }

  return background;
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Background image failed to load."));
    image.src = src;
  });

const drawCoverImage = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) => {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const boxRatio = width / height;
  const drawWidth = imageRatio > boxRatio ? height * imageRatio : width;
  const drawHeight = drawWidth / imageRatio;

  context.drawImage(
    image,
    (width - drawWidth) / 2,
    (height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
};

export const loadBackgroundTexture = async (
  background: string,
  width: number,
  height: number,
) => {
  const key = `${background}:${width}x${height}`;
  const cachedTexture = textureCache.get(key);
  if (cachedTexture) return cachedTexture;

  const activePromise = texturePromises.get(key);
  if (activePromise) return activePromise;

  const promise = (async () => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = width;
    canvas.height = height;

    if (!context) {
      const emptyTexture = Texture.EMPTY;
      textureCache.set(key, emptyTexture);
      return emptyTexture;
    }

    context.fillStyle = createFillStyle(context, background, width, height);
    context.fillRect(0, 0, width, height);

    const imageBackground = parseCssImageBackground(background);

    if (imageBackground) {
      try {
        const image = await loadImage(imageBackground.src);
        drawCoverImage(context, image, width, height);
      } catch {
        context.fillStyle = "#f8fafc";
        context.fillRect(0, 0, width, height);
      }
    }

    const texture = Texture.from(canvas);
    textureCache.set(key, texture);
    texturePromises.delete(key);
    return texture;
  })();

  texturePromises.set(key, promise);
  return promise;
};
