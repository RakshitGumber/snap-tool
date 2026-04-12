export function splitOrigins(value: string | undefined, fallback: string[]) {
  const normalized = (value ?? "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  return normalized.length > 0 ? normalized : fallback;
}
