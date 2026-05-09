// Review note: Import helpers that turn local files and supported URLs into upload-library asset records.
// The comments in this file are intentionally dense to support the requested review pass.

import type { UploadAssetSource, UploadLibraryAssetMeta } from "@/types/uploads";

/**
 * Documents the resolved import asset contract used by the surrounding feature.
 */
type ResolvedImportAsset = Pick<
  UploadLibraryAssetMeta,
  | "name"
  | "source"
  | "originalUrl"
  | "previewUrl"
  | "remoteUrl"
  | "mimeType"
  | "width"
  | "height"
>;

/**
 * Keeps max_preview_edge in one named constant so related calculations stay consistent.
 */
const MAX_PREVIEW_EDGE = 256;

/**
 * Handles the load image element behavior for this module.
 */
const loadImageElement = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.decoding = "async";
    image.referrerPolicy = "no-referrer";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image failed to load."));
    image.src = src;
  });

/**
 * Loads an image just far enough to read its intrinsic dimensions.
 */
export const loadImageDimensions = async (src: string) => {
  const image = await loadImageElement(src);

  return {
    width: image.naturalWidth || image.width,
    height: image.naturalHeight || image.height,
  };
};

/**
 * Builds create preview blob from normalized inputs.
 */
const createPreviewBlob = async ({
  src,
  mimeType,
}: {
  src: string;
  mimeType?: string;
}) => {
  const image = await loadImageElement(src);
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const longestEdge = Math.max(width, height, 1);
  const scale = Math.min(MAX_PREVIEW_EDGE / longestEdge, 1);
  const previewWidth = Math.max(1, Math.round(width * scale));
  const previewHeight = Math.max(1, Math.round(height * scale));

  if (scale >= 1 && mimeType && mimeType !== "image/svg+xml") {
    // Return the resolved value to the caller after all guards and transformations.
    return {
      blob: null,
      width,
      height,
    };
  }

  const canvas = document.createElement("canvas");
  canvas.width = previewWidth;
  canvas.height = previewHeight;

  const context = canvas.getContext("2d");
  // Guard this branch so missing or invalid state does not flow into the main path.
  if (!context) {
    throw new Error("Unable to create an image preview.");
  }

  context.drawImage(image, 0, 0, previewWidth, previewHeight);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", 0.82);
  });

  return {
    blob,
    width: previewWidth,
    height: previewHeight,
  };
};

/**
 * Resolves get you tube video id from the available editor state.
 */
const getYouTubeVideoId = (input: string) => {
  // Isolate fallible browser or storage work so failures can be reported without crashing the UI.
  try {
    const url = new URL(input);
    const host = url.hostname.toLowerCase();

    if (host === "youtu.be" || host === "www.youtu.be") {
      // Return null when this helper cannot produce a usable value.
      return url.pathname.split("/").filter(Boolean)[0] ?? null;
    }

    if (
      host === "youtube.com" ||
      host === "www.youtube.com" ||
      host === "m.youtube.com"
    ) {
      const directId = url.searchParams.get("v");
      // Guard this branch so missing or invalid state does not flow into the main path.
      if (directId) return directId;

      const [, variant, value] = url.pathname.split("/");
      // Keep this conditional branch explicit because it changes the user-visible editor behavior.
      if (variant === "embed" || variant === "shorts" || variant === "live") {
        // Return null when this helper cannot produce a usable value.
        return value ?? null;
      }
    }

    if (host === "img.youtube.com" || host === "i.ytimg.com") {
      const [, variant, value] = url.pathname.split("/");
      // Keep this conditional branch explicit because it changes the user-visible editor behavior.
      if (variant === "vi") {
        // Return null when this helper cannot produce a usable value.
        return value ?? null;
      }
    }
  } catch {
    // Return null when this helper cannot produce a usable value.
    return null;
  }

  return null;
};

/**
 * Answers the is git hub host predicate used to choose the next branch.
 */
const isGitHubHost = (host: string) => host === "github.com" || host === "www.github.com";

/**
 * Resolves get git hub repository path from the available editor state.
 */
const getGitHubRepositoryPath = (input: string) => {
  let url: URL;

  try {
    url = new URL(input);
  } catch {
    // Return null when this helper cannot produce a usable value.
    return null;
  }

  if (!isGitHubHost(url.hostname.toLowerCase())) {
    // Return null when this helper cannot produce a usable value.
    return null;
  }

  const segments = url.pathname.split("/").filter(Boolean);
  // Handle collection boundaries before continuing with the resolved values.
  if (segments.length !== 2) {
    throw new Error("Paste a public GitHub repository URL like https://github.com/owner/repo.");
  }

  return {
    owner: segments[0],
    repo: segments[1],
    originalUrl: `${url.origin}/${segments[0]}/${segments[1]}`,
  };
};

/**
 * Resolves resolve git hub repository preview from the available editor state.
 */
const resolveGitHubRepositoryPreview = async (
  input: string,
): Promise<ResolvedImportAsset | null> => {
  const repositoryPath = getGitHubRepositoryPath(input);
  // Guard this branch so missing or invalid state does not flow into the main path.
  if (!repositoryPath) {
    // Return null when this helper cannot produce a usable value.
    return null;
  }

  const versionKey = Date.now().toString(36);
  const previewUrl = `https://opengraph.githubassets.com/${versionKey}/${repositoryPath.owner}/${repositoryPath.repo}`;
  const { width, height } = await loadImageDimensions(previewUrl);

  return {
    name: `${repositoryPath.owner}/${repositoryPath.repo}`,
    source: "github",
    previewUrl,
    remoteUrl: previewUrl,
    originalUrl: repositoryPath.originalUrl,
    mimeType: "image/png",
    width,
    height,
  };
};

/**
 * Resolves resolve you tube thumbnail from the available editor state.
 */
const resolveYouTubeThumbnail = async (input: string): Promise<ResolvedImportAsset | null> => {
  const videoId = getYouTubeVideoId(input);
  // Guard this branch so missing or invalid state does not flow into the main path.
  if (!videoId) return null;

  const thumbnailCandidates = [
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  ];

  for (const previewUrl of thumbnailCandidates) {
    // Isolate fallible browser or storage work so failures can be reported without crashing the UI.
    try {
      const { width, height } = await loadImageDimensions(previewUrl);

      return {
        name: `YouTube ${videoId}`,
        source: "youtube",
        previewUrl,
        remoteUrl: previewUrl,
        originalUrl: input,
        mimeType: "image/jpeg",
        width,
        height,
      };
    } catch {
      continue;
    }
  }

  throw new Error("Unable to load a YouTube thumbnail for that link.");
};

/**
 * Builds build image url name from normalized inputs.
 */
const buildImageUrlName = (url: URL) => {
  const pathname = url.pathname.split("/").filter(Boolean);
  const fallbackName = pathname.at(-1) || url.hostname;

  return fallbackName.split("?")[0];
};

/**
 * Resolves resolve direct image url from the available editor state.
 */
const resolveDirectImageUrl = async (input: string): Promise<ResolvedImportAsset> => {
  let url: URL;

  try {
    url = new URL(input);
  } catch {
    throw new Error("Enter a valid URL.");
  }

  const remoteUrl = url.toString();
  const { width, height } = await loadImageDimensions(remoteUrl);

  return {
    name: buildImageUrlName(url),
    source: "image-url",
    previewUrl: remoteUrl,
    remoteUrl,
    originalUrl: remoteUrl,
    mimeType: undefined,
    width,
    height,
  };
};

/**
 * Creates metadata and preview/full binaries for a local image file.
 */
export const createLocalUploadAsset = async (file: File) => {
  const localUrl = URL.createObjectURL(file);

  try {
    const { width, height } = await loadImageDimensions(localUrl);
    const preview = await createPreviewBlob({
      src: localUrl,
      mimeType: file.type || "image/*",
    });

    return {
      meta: {
        id: crypto.randomUUID(),
        name: file.name,
        source: "local-file" as UploadAssetSource,
        mimeType: file.type || "image/*",
        width,
        height,
        addedAt: new Date().toISOString(),
        storageKind: "local-indexeddb" as const,
        originalUrl: undefined,
        previewUrl: null,
        remoteUrl: null,
      } satisfies UploadLibraryAssetMeta,
      originalBlob: file,
      previewBlob: preview.blob ?? file,
      previewMimeType: preview.blob?.type || file.type || "image/*",
    };
  } finally {
    URL.revokeObjectURL(localUrl);
  }
};

/**
 * Resolves supported remote URLs into upload-library metadata and preview media.
 */
export const resolveAssetFromUrl = async (input: string) => {
  const trimmedUrl = input.trim();
  // Guard this branch so missing or invalid state does not flow into the main path.
  if (!trimmedUrl) {
    throw new Error("Paste a YouTube link, GitHub repository URL, or direct image URL.");
  }

  const youTubeAsset = await resolveYouTubeThumbnail(trimmedUrl);
  // Keep this conditional branch explicit because it changes the user-visible editor behavior.
  if (youTubeAsset) {
    // Return the resolved value to the caller after all guards and transformations.
    return {
      id: crypto.randomUUID(),
      addedAt: new Date().toISOString(),
      storageKind: "remote-url" as const,
      ...youTubeAsset,
    } satisfies UploadLibraryAssetMeta;
  }

  const gitHubAsset = await resolveGitHubRepositoryPreview(trimmedUrl);
  // Keep this conditional branch explicit because it changes the user-visible editor behavior.
  if (gitHubAsset) {
    // Return the resolved value to the caller after all guards and transformations.
    return {
      id: crypto.randomUUID(),
      addedAt: new Date().toISOString(),
      storageKind: "remote-url" as const,
      ...gitHubAsset,
    } satisfies UploadLibraryAssetMeta;
  }

  const directImageAsset = await resolveDirectImageUrl(trimmedUrl);

  return {
    id: crypto.randomUUID(),
    addedAt: new Date().toISOString(),
    storageKind: "remote-url" as const,
    ...directImageAsset,
  } satisfies UploadLibraryAssetMeta;
};
