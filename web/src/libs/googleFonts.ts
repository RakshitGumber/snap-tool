import { useEffect, useState } from "react";

import { normalizeBoardTextFamily } from "@/board/text";

type GoogleFontsCatalogState = {
  families: string[];
  source: "api" | "fallback";
  status: "idle" | "loading" | "ready" | "unavailable" | "error";
};

type GoogleFontsApiResponse = {
  items?: Array<{
    family?: string;
  }>;
};

const GOOGLE_FONTS_STYLESHEET_BASE_URL = "https://fonts.googleapis.com/css2";
const GOOGLE_FONTS_WEBFONTS_API_URL =
  "https://www.googleapis.com/webfonts/v1/webfonts?sort=alpha";

const FALLBACK_GOOGLE_FONT_FAMILIES = [
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
  "Bebas Neue",
  "Pacifico",
  "Kaushan Script",
  "Carter One",
];

const loadedFontFamilies = new Set<string>();

const buildGoogleFontsStylesheetUrl = (fontFamily: string) => {
  const family = normalizeBoardTextFamily(fontFamily);
  const params = new URLSearchParams({
    family,
    display: "swap",
  });

  return `${GOOGLE_FONTS_STYLESHEET_BASE_URL}?${params.toString().replace(/%20/g, "+")}`;
};

export const ensureGoogleFontLoaded = (fontFamily: string) => {
  if (typeof document === "undefined") {
    return;
  }

  const family = normalizeBoardTextFamily(fontFamily);
  if (!family) {
    return;
  }

  const normalizedKey = family.toLowerCase();
  if (loadedFontFamilies.has(normalizedKey)) {
    return;
  }

  loadedFontFamilies.add(normalizedKey);

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = buildGoogleFontsStylesheetUrl(family);
  link.dataset.googleFontFamily = family;
  document.head.appendChild(link);
};

const getGoogleFontsApiKey = () => import.meta.env.VITE_GOOGLE_FONTS_API_KEY?.trim() ?? "";

export const useGoogleFontsCatalog = (): GoogleFontsCatalogState => {
  const [state, setState] = useState<GoogleFontsCatalogState>({
    families: FALLBACK_GOOGLE_FONT_FAMILIES,
    source: "fallback",
    status: "idle",
  });

  useEffect(() => {
    const apiKey = getGoogleFontsApiKey();
    if (!apiKey) {
      setState({
        families: FALLBACK_GOOGLE_FONT_FAMILIES,
        source: "fallback",
        status: "unavailable",
      });
      return;
    }

    const controller = new AbortController();

    const loadCatalog = async () => {
      setState((previousState) => ({ ...previousState, status: "loading" }));

      try {
        const response = await fetch(
          `${GOOGLE_FONTS_WEBFONTS_API_URL}&key=${encodeURIComponent(apiKey)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(`Google Fonts catalog request failed with ${response.status}`);
        }

        const data = (await response.json()) as GoogleFontsApiResponse;
        const families = Array.from(
          new Set(
            (data.items ?? [])
              .map((item) => normalizeBoardTextFamily(item.family ?? ""))
              .filter(Boolean),
          ),
        );

        setState({
          families: families.length ? families : FALLBACK_GOOGLE_FONT_FAMILIES,
          source: families.length ? "api" : "fallback",
          status: "ready",
        });
      } catch {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          families: FALLBACK_GOOGLE_FONT_FAMILIES,
          source: "fallback",
          status: "error",
        });
      }
    };

    void loadCatalog();

    return () => controller.abort();
  }, []);

  return state;
};
