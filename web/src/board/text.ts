import type { BoardTextInput } from "@/types/canvas";

export const DEFAULT_BOARD_TEXT_INPUT: BoardTextInput = {
  text: "Add your message",
  fontFamily: "Mulish",
  fontSize: 56,
  fontWeight: 700,
  color: "#0F172A",
  align: "center",
  maxWidth: 320,
};

export const BOARD_TEXT_WEIGHT_OPTIONS = [300, 400, 500, 600, 700, 800, 900];

export const normalizeBoardTextFamily = (value: string) =>
  value.trim().replace(/^['"]+|['"]+$/g, "").replace(/\s+/g, " ");
