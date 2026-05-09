import { useEffect, useState } from "react";
import { normalizeBoardTextFamily } from "@/stores/useConfigStore";

export type GoogleFontsSource = "api" | "fallback";
export type GoogleFontsStatus =
  | "idle"
  | "loading"
  | "ready"
  | "unavailable"
  | "error";

export interface GoogleFontsCatalogState {
  families: string[];
  source: GoogleFontsSource;
  status: GoogleFontsStatus;
}

interface GoogleFontsApiResponse {
  items?: Array<{ family?: string }>;
}

const GOOGLE_FONTS_STYLESHEET_BASE_URL = "https://fonts.googleapis.com/css2";
const GOOGLE_FONTS_WEBFONTS_API_URL =
  "https://www.googleapis.com/webfonts/v1/webfonts?sort=alpha";

const FALLBACK_FONTS = [
  "Mulish",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Oswald",
  "Raleway",
  "Playfair Display",
  "Merriweather",
];

const loadedFontFamilies = new Set<string>();
let catalogCache: string[] | null = null;
let sharedFetchPromise: Promise<string[]> | null = null;

const setupGoogleFontsPreconnect = (): void => {
  if (
    typeof document === "undefined" ||
    document.head.querySelector("[data-google-fonts-preconnect]")
  ) {
    return;
  }

  const createPreconnect = (href: string, crossOrigin = false) => {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = href;
    link.dataset.googleFontsPreconnect = "true";
    if (crossOrigin) link.crossOrigin = "anonymous";
    return link;
  };

  document.head.append(
    createPreconnect("https://fonts.googleapis.com"),
    createPreconnect("https://fonts.gstatic.com", true),
  );
};

const buildGoogleFontsStylesheetUrl = (fontFamily: string): string => {
  const params = new URLSearchParams({
    family: fontFamily,
    display: "swap",
  });
  return `${GOOGLE_FONTS_STYLESHEET_BASE_URL}?${params.toString()}`;
};

export const ensureGoogleFontLoaded = (fontFamily: string): void => {
  if (typeof document === "undefined") return;

  const family = normalizeBoardTextFamily(fontFamily);
  if (!family) return;

  const normalizedKey = family.toLowerCase();
  if (loadedFontFamilies.has(normalizedKey)) return;

  loadedFontFamilies.add(normalizedKey);
  setupGoogleFontsPreconnect();

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = buildGoogleFontsStylesheetUrl(family);
  link.dataset.googleFontFamily = family;
  document.head.appendChild(link);
};

const getGoogleFontsApiKey = (): string => {
  try {
    return import.meta.env?.VITE_GOOGLE_FONTS_API_KEY?.trim() ?? "";
  } catch {
    return "";
  }
};

const fetchFontCatalog = async (apiKey: string): Promise<string[]> => {
  if (catalogCache) return catalogCache;

  if (sharedFetchPromise) return sharedFetchPromise;

  sharedFetchPromise = (async () => {
    try {
      const response = await fetch(
        `${GOOGLE_FONTS_WEBFONTS_API_URL}&key=${encodeURIComponent(apiKey)}`,
      );

      if (!response.ok) {
        throw new Error(
          `Google Fonts API failed with status: ${response.status}`,
        );
      }

      const data = (await response.json()) as GoogleFontsApiResponse;

      const families = Array.from(
        new Set(
          (data.items ?? [])
            .map((item) => normalizeBoardTextFamily(item.family ?? ""))
            .filter(Boolean),
        ),
      );

      catalogCache = families.length > 0 ? families : FALLBACK_FONTS;
      return catalogCache;
    } catch (error) {
      console.error("Failed to fetch Google Fonts catalog:", error);
      catalogCache = null;
      throw error;
    } finally {
      sharedFetchPromise = null;
    }
  })();

  return sharedFetchPromise;
};

export const useGoogleFontsCatalog = (): GoogleFontsCatalogState => {
  const apiKey = getGoogleFontsApiKey();

  const [state, setState] = useState<GoogleFontsCatalogState>(() => {
    if (catalogCache)
      return { families: catalogCache, source: "api", status: "ready" };
    if (!apiKey)
      return {
        families: FALLBACK_FONTS,
        source: "fallback",
        status: "unavailable",
      };
    return { families: FALLBACK_FONTS, source: "fallback", status: "loading" };
  });

  useEffect(() => {
    if (catalogCache || !apiKey) return;

    let isMounted = true;

    const loadCatalog = async () => {
      try {
        const families = await fetchFontCatalog(apiKey);

        if (!isMounted) return;

        setState({
          families,
          source: families === FALLBACK_FONTS ? "fallback" : "api",
          status: "ready",
        });
      } catch {
        if (!isMounted) return;

        setState({
          families: FALLBACK_FONTS,
          source: "fallback",
          status: "error",
        });
      }
    };

    void loadCatalog();

    return () => {
      isMounted = false;
    };
  }, [apiKey]);

  return state;
};
