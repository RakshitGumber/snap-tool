import type { UploadAssetSource, UploadLibraryAsset } from "@/types/uploads";

type ResolvedImportAsset = Pick<
  UploadLibraryAsset,
  "name" | "source" | "src" | "thumbnailSrc" | "originalUrl" | "mimeType" | "width" | "height"
>;

export const loadImageDimensions = (src: string) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();

    image.decoding = "async";
    image.referrerPolicy = "no-referrer";
    image.onload = () => {
      resolve({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      });
    };
    image.onerror = () => reject(new Error("Image failed to load."));
    image.src = src;
  });

const getYouTubeVideoId = (input: string) => {
  try {
    const url = new URL(input);
    const host = url.hostname.toLowerCase();

    if (host === "youtu.be" || host === "www.youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] ?? null;
    }

    if (
      host === "youtube.com" ||
      host === "www.youtube.com" ||
      host === "m.youtube.com"
    ) {
      const directId = url.searchParams.get("v");
      if (directId) return directId;

      const [, variant, value] = url.pathname.split("/");
      if (variant === "embed" || variant === "shorts" || variant === "live") {
        return value ?? null;
      }
    }

    if (host === "img.youtube.com" || host === "i.ytimg.com") {
      const [, variant, value] = url.pathname.split("/");
      if (variant === "vi") {
        return value ?? null;
      }
    }
  } catch {
    return null;
  }

  return null;
};

const isGitHubHost = (host: string) => host === "github.com" || host === "www.github.com";

const getGitHubRepositoryPath = (input: string) => {
  let url: URL;

  try {
    url = new URL(input);
  } catch {
    return null;
  }

  if (!isGitHubHost(url.hostname.toLowerCase())) {
    return null;
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length !== 2) {
    throw new Error("Paste a public GitHub repository URL like https://github.com/owner/repo.");
  }

  return {
    owner: segments[0],
    repo: segments[1],
    originalUrl: `${url.origin}/${segments[0]}/${segments[1]}`,
  };
};

const resolveGitHubRepositoryPreview = async (
  input: string,
): Promise<ResolvedImportAsset | null> => {
  const repositoryPath = getGitHubRepositoryPath(input);
  if (!repositoryPath) {
    return null;
  }

  const versionKey = Date.now().toString(36);
  const previewSrc = `https://opengraph.githubassets.com/${versionKey}/${repositoryPath.owner}/${repositoryPath.repo}`;
  const { width, height } = await loadImageDimensions(previewSrc);

  return {
    name: `${repositoryPath.owner}/${repositoryPath.repo}`,
    source: "github",
    src: previewSrc,
    thumbnailSrc: previewSrc,
    originalUrl: repositoryPath.originalUrl,
    mimeType: "image/png",
    width,
    height,
  };
};

const resolveYouTubeThumbnail = async (input: string): Promise<ResolvedImportAsset | null> => {
  const videoId = getYouTubeVideoId(input);
  if (!videoId) return null;

  const thumbnailCandidates = [
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  ];

  for (const thumbnailSrc of thumbnailCandidates) {
    try {
      const { width, height } = await loadImageDimensions(thumbnailSrc);

      return {
        name: `YouTube ${videoId}`,
        source: "youtube",
        src: thumbnailSrc,
        thumbnailSrc,
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

const buildImageUrlName = (url: URL) => {
  const pathname = url.pathname.split("/").filter(Boolean);
  const fallbackName = pathname.at(-1) || url.hostname;

  return fallbackName.split("?")[0];
};

const resolveDirectImageUrl = async (input: string): Promise<ResolvedImportAsset> => {
  let url: URL;

  try {
    url = new URL(input);
  } catch {
    throw new Error("Enter a valid URL.");
  }

  const { width, height } = await loadImageDimensions(url.toString());

  return {
    name: buildImageUrlName(url),
    source: "image-url",
    src: url.toString(),
    thumbnailSrc: url.toString(),
    originalUrl: url.toString(),
    mimeType: undefined,
    width,
    height,
  };
};

export const createLocalUploadAsset = async (file: File) => {
  const localUrl = URL.createObjectURL(file);

  try {
    const { width, height } = await loadImageDimensions(localUrl);

    return {
      id: crypto.randomUUID(),
      name: file.name,
      source: "local-file" as UploadAssetSource,
      src: localUrl,
      thumbnailSrc: localUrl,
      mimeType: file.type || "image/*",
      width,
      height,
      addedAt: new Date().toISOString(),
      storageKind: "indexeddb-blob" as const,
      blob: file,
    };
  } catch (error) {
    URL.revokeObjectURL(localUrl);
    throw error;
  }
};

export const resolveAssetFromUrl = async (input: string) => {
  const trimmedUrl = input.trim();
  if (!trimmedUrl) {
    throw new Error("Paste a YouTube link, GitHub repository URL, or direct image URL.");
  }

  const youTubeAsset = await resolveYouTubeThumbnail(trimmedUrl);
  if (youTubeAsset) {
    return {
      id: crypto.randomUUID(),
      addedAt: new Date().toISOString(),
      storageKind: "remote-url" as const,
      ...youTubeAsset,
    };
  }

  const gitHubAsset = await resolveGitHubRepositoryPreview(trimmedUrl);
  if (gitHubAsset) {
    return {
      id: crypto.randomUUID(),
      addedAt: new Date().toISOString(),
      storageKind: "remote-url" as const,
      ...gitHubAsset,
    };
  }

  const directImageAsset = await resolveDirectImageUrl(trimmedUrl);

  return {
    id: crypto.randomUUID(),
    addedAt: new Date().toISOString(),
    storageKind: "remote-url" as const,
    ...directImageAsset,
  };
};
