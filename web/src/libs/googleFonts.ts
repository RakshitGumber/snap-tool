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
  items?: Array<{
    family?: string;
  }>;
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

let cachedCatalog: string[] | null = null;
let catalogFetchPromise: Promise<string[]> | null = null;
const setupGoogleFontsPreconnect = () => {
  if (
    typeof document === "undefined" ||
    document.head.querySelector("[data-google-fonts-preconnect]")
  ) {
    return;
  }

  const preconnectAPI = document.createElement("link");
  preconnectAPI.rel = "preconnect";
  preconnectAPI.href = "https://fonts.googleapis.com";
  preconnectAPI.dataset.googleFontsPreconnect = "true";

  const preconnectGstatic = document.createElement("link");
  preconnectGstatic.rel = "preconnect";
  preconnectGstatic.href = "https://fonts.gstatic.com";
  preconnectGstatic.crossOrigin = "anonymous";
  preconnectGstatic.dataset.googleFontsPreconnect = "true";

  document.head.append(preconnectAPI, preconnectGstatic);
};

const buildGoogleFontsStylesheetUrl = (fontFamily: string) => {
  const family = normalizeBoardTextFamily(fontFamily);
  const params = new URLSearchParams({
    family,
    display: "swap",
  });

  // URLSearchParams automatically encodes spaces to "+" so .replace() is redundant
  return `${GOOGLE_FONTS_STYLESHEET_BASE_URL}?${params.toString()}`;
};

export const ensureGoogleFontLoaded = (fontFamily: string) => {
  if (typeof document === "undefined") return;

  const family = normalizeBoardTextFamily(fontFamily);
  if (!family) return;

  const normalizedKey = family.toLowerCase();
  if (loadedFontFamilies.has(normalizedKey)) return;

  loadedFontFamilies.add(normalizedKey);

  // Connect to Google servers early for better performance
  setupGoogleFontsPreconnect();

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = buildGoogleFontsStylesheetUrl(family);
  link.dataset.googleFontFamily = family;
  document.head.appendChild(link);
};

const getGoogleFontsApiKey = () =>
  import.meta.env.VITE_GOOGLE_FONTS_API_KEY?.trim() ?? "";

export const useGoogleFontsCatalog = (): GoogleFontsCatalogState => {
  const apiKey = getGoogleFontsApiKey();

  const [state, setState] = useState<GoogleFontsCatalogState>(() => {
    if (cachedCatalog) {
      return { families: cachedCatalog, source: "api", status: "ready" };
    }
    if (!apiKey) {
      return {
        families: FALLBACK_FONTS,
        source: "fallback",
        status: "unavailable",
      };
    }
    return { families: FALLBACK_FONTS, source: "fallback", status: "loading" };
  });

  useEffect(() => {
    if (cachedCatalog || !apiKey) return;

    const controller = new AbortController();

    const loadCatalog = async () => {
      try {
        if (!catalogFetchPromise) {
          catalogFetchPromise = fetch(
            `${GOOGLE_FONTS_WEBFONTS_API_URL}&key=${encodeURIComponent(apiKey)}`,
            { signal: controller.signal },
          ).then(async (response) => {
            if (!response.ok) {
              throw new Error(`Google Fonts API failed: ${response.status}`);
            }

            const data = (await response.json()) as GoogleFontsApiResponse;
            const families = Array.from(
              new Set(
                (data.items ?? [])
                  .map((item) => normalizeBoardTextFamily(item.family ?? ""))
                  .filter(Boolean),
              ),
            );

            return families.length ? families : FALLBACK_FONTS;
          });
        }

        const families = await catalogFetchPromise;
        cachedCatalog = families;

        setState({
          families,
          source: families === FALLBACK_FONTS ? "fallback" : "api",
          status: "ready",
        });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;

        catalogFetchPromise = null;
        setState({
          families: FALLBACK_FONTS,
          source: "fallback",
          status: "error",
        });
      }
    };

    void loadCatalog();

    return () => controller.abort();
  }, [apiKey]);

  return state;
};
