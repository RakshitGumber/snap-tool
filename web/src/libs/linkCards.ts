export type LinkCardMetadataSource =
  | "youtube"
  | "github"
  | "website"
  | "screenshot";

export type YouTubeLinkCardMetadata = {
  source: "youtube";
  originalUrl: string;
  videoId: string;
  title: string;
  subtitle: string;
  description: string;
  thumbnailUrl: string;
  startTimeLabel: string | null;
  stats: string[];
};

export type GitHubLinkCardMetadata = {
  source: "github";
  originalUrl: string;
  targetType: "profile" | "repo";
  title: string;
  subtitle: string;
  description: string;
  avatarUrl: string | null;
  openGraphUrl: string;
  stats: string[];
};

export type WebsiteLinkCardMetadata = {
  source: "website";
  originalUrl: string;
  title: string;
  subtitle: string;
  description: string;
  hostname: string;
  faviconUrl: string;
  stats: string[];
};

export type ScreenshotLinkCardMetadata = {
  source: "screenshot";
  originalUrl: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  stats: string[];
};

export type LinkCardMetadata =
  | YouTubeLinkCardMetadata
  | GitHubLinkCardMetadata
  | WebsiteLinkCardMetadata
  | ScreenshotLinkCardMetadata;

type GitHubRepoResponse = {
  full_name?: string;
  description?: string | null;
  stargazers_count?: number;
  forks_count?: number;
  language?: string | null;
  owner?: {
    login?: string;
    avatar_url?: string;
  };
};

type GitHubUserResponse = {
  login?: string;
  name?: string | null;
  bio?: string | null;
  avatar_url?: string;
  public_repos?: number;
  followers?: number;
  following?: number;
};

type YouTubeOEmbedResponse = {
  title?: string;
  author_name?: string;
};

const normalizeUrl = (input: string) => {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error("Paste a YouTube, GitHub, or website link.");
  }

  try {
    return new URL(trimmed);
  } catch {
    try {
      return new URL(`https://${trimmed}`);
    } catch {
      throw new Error("Enter a valid URL.");
    }
  }
};

const loadImageElement = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.decoding = "async";
    image.referrerPolicy = "no-referrer";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image failed to load."));
    image.src = src;
  });

const loadImageDimensions = async (src: string) => {
  const image = await loadImageElement(src);

  return {
    width: image.naturalWidth || image.width,
    height: image.naturalHeight || image.height,
  };
};

const isYouTubeHost = (host: string) =>
  host === "youtube.com" ||
  host === "www.youtube.com" ||
  host === "m.youtube.com" ||
  host === "youtu.be" ||
  host === "www.youtu.be" ||
  host === "img.youtube.com" ||
  host === "i.ytimg.com";

const isGitHubHost = (host: string) =>
  host === "github.com" || host === "www.github.com";

const formatCount = (value: number | undefined) =>
  typeof value === "number" ? new Intl.NumberFormat().format(value) : "0";

const getYouTubeVideoId = (url: URL) => {
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

    if (variant === "vi") return value ?? null;
  }

  return null;
};

const getYouTubeStartTimeLabel = (url: URL) => {
  const rawTime =
    url.searchParams.get("t") ??
    url.searchParams.get("start") ??
    url.hash.replace(/^#t=/, "");

  if (!rawTime) return null;

  const seconds =
    rawTime.match(/^\d+$/) !== null
      ? Number(rawTime)
      : (rawTime
          .match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/)
          ?.slice(1)
          .reduce((total, part, index) => {
            const value = Number(part ?? 0);
            const multipliers = [3600, 60, 1];

            return total + value * multipliers[index];
          }, 0) ?? 0);

  if (!Number.isFinite(seconds) || seconds <= 0) return null;

  const rounded = Math.round(seconds);
  const minutes = Math.floor(rounded / 60);
  const remainingSeconds = rounded % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const resolveYouTubeThumbnail = async (videoId: string) => {
  const candidates = [
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  ];

  for (const candidate of candidates) {
    try {
      await loadImageDimensions(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  throw new Error("Unable to load a YouTube thumbnail for that link.");
};

const resolveYouTubeMetadata = async (
  url: URL,
): Promise<YouTubeLinkCardMetadata> => {
  const videoId = getYouTubeVideoId(url);

  if (!videoId) {
    throw new Error("Paste a valid YouTube video link.");
  }

  const thumbnailUrl = await resolveYouTubeThumbnail(videoId);
  let title = `YouTube ${videoId}`;
  let subtitle = "YouTube";

  try {
    const oEmbedUrl = new URL("https://www.youtube.com/oembed");

    oEmbedUrl.searchParams.set("url", url.toString());
    oEmbedUrl.searchParams.set("format", "json");

    const response = await fetch(oEmbedUrl);

    if (response.ok) {
      const data = (await response.json()) as YouTubeOEmbedResponse;

      title = data.title?.trim() || title;
      subtitle = data.author_name?.trim() || subtitle;
    }
  } catch {
    // Thumbnail metadata is enough to render a useful no-key card.
  }

  return {
    source: "youtube",
    originalUrl: url.toString(),
    videoId,
    title,
    subtitle,
    description: subtitle,
    thumbnailUrl,
    startTimeLabel: getYouTubeStartTimeLabel(url),
    stats: [],
  };
};

const parseGitHubPath = (url: URL) => {
  const segments = url.pathname.split("/").filter(Boolean);

  if (segments.length === 1) {
    return {
      type: "profile" as const,
      owner: segments[0],
      repo: null,
    };
  }

  if (segments.length >= 2) {
    return {
      type: "repo" as const,
      owner: segments[0],
      repo: segments[1],
    };
  }

  throw new Error("Paste a GitHub profile or repository link.");
};

const resolveGitHubMetadata = async (
  url: URL,
): Promise<GitHubLinkCardMetadata> => {
  const target = parseGitHubPath(url);
  const openGraphPath =
    target.type === "repo"
      ? `${target.owner}/${target.repo}`
      : `${target.owner}`;
  const openGraphUrl = `https://opengraph.githubassets.com/1/${openGraphPath}`;

  if (target.type === "repo" && target.repo) {
    let title = `${target.owner}/${target.repo}`;
    let description = "GitHub repository";
    let avatarUrl: string | null = null;
    let subtitle = "Repository";
    let stats = ["0 stars", "0 forks"];

    try {
      const response = await fetch(
        `https://api.github.com/repos/${target.owner}/${target.repo}`,
      );

      if (response.ok) {
        const repo = (await response.json()) as GitHubRepoResponse;

        title = repo.full_name ?? title;
        description = repo.description ?? description;
        avatarUrl = repo.owner?.avatar_url ?? null;
        subtitle = repo.language ? `${repo.language} repository` : subtitle;
        stats = [
          `${formatCount(repo.stargazers_count)} stars`,
          `${formatCount(repo.forks_count)} forks`,
        ];
      }
    } catch {
      // Fallback path-only metadata keeps the card usable offline or rate limited.
    }

    return {
      source: "github",
      originalUrl: `https://github.com/${target.owner}/${target.repo}`,
      targetType: "repo",
      title,
      subtitle,
      description,
      avatarUrl,
      openGraphUrl,
      stats,
    };
  }

  let title = target.owner;
  let subtitle = `@${target.owner}`;
  let description = "GitHub profile";
  let avatarUrl: string | null = null;
  let stats = ["0 repositories", "0 followers"];

  try {
    const response = await fetch(`https://api.github.com/users/${target.owner}`);

    if (response.ok) {
      const user = (await response.json()) as GitHubUserResponse;

      title = user.name?.trim() || user.login || title;
      subtitle = `@${user.login ?? target.owner}`;
      description = user.bio?.trim() || description;
      avatarUrl = user.avatar_url ?? null;
      stats = [
        `${formatCount(user.public_repos)} repositories`,
        `${formatCount(user.followers)} followers`,
        `${formatCount(user.following)} following`,
      ];
    }
  } catch {
    // Fallback path-only metadata keeps the card usable offline or rate limited.
  }

  return {
    source: "github",
    originalUrl: `https://github.com/${target.owner}`,
    targetType: "profile",
    title,
    subtitle,
    description,
    avatarUrl,
    openGraphUrl,
    stats,
  };
};

const resolveWebsiteMetadata = (url: URL): WebsiteLinkCardMetadata => {
  const normalized = new URL(url.toString());

  normalized.hash = "";

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
    normalized.hostname,
  )}&sz=128`;
  const title = normalized.hostname.replace(/^www\./, "");

  return {
    source: "website",
    originalUrl: normalized.toString(),
    title,
    subtitle: normalized.hostname,
    description: normalized.toString(),
    hostname: normalized.hostname,
    faviconUrl,
    stats: [],
  };
};

export const resolveLinkCardMetadata = async (
  input: string,
): Promise<LinkCardMetadata> => {
  const url = normalizeUrl(input);
  const host = url.hostname.toLowerCase();

  if (isYouTubeHost(host)) return resolveYouTubeMetadata(url);
  if (isGitHubHost(host)) return resolveGitHubMetadata(url);

  return resolveWebsiteMetadata(url);
};

export const createScreenshotMetadata = async (
  file: File,
): Promise<ScreenshotLinkCardMetadata> => {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file.");
  }

  const imageUrl = URL.createObjectURL(file);

  try {
    const dimensions = await loadImageDimensions(imageUrl);

    return {
      source: "screenshot",
      originalUrl: imageUrl,
      title: file.name,
      subtitle: "Screenshot",
      description: file.name,
      imageUrl,
      imageWidth: dimensions.width,
      imageHeight: dimensions.height,
      stats: [],
    };
  } catch (error) {
    URL.revokeObjectURL(imageUrl);
    throw error;
  }
};
