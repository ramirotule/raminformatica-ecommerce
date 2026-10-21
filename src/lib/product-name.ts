const UPPERCASE_TOKENS = new Set([
  "gb",
  "tb",
  "hz",
  "mah",
  "w",
  "v",
  "a",
  "wh",
  "ssd",
  "hdd",
  "ram",
  "rom",
  "rgb",
  "led",
  "qled",
  "oled",
  "uhd",
  "fhd",
  "hd",
  "ips",
  "usb",
  "usb-c",
  "wifi",
  "nfc",
  "gps",
  "pc",
  "ps4",
  "ps5",
]);

function capitalizeWord(word: string): string {
  if (!word) return word;
  const lower = word.toLowerCase();
  return lower.replace(/^[a-záéíóúñü]/, (m) => m.toUpperCase());
}

function normalizeToken(token: string): string {
  const trimmed = token.trim();
  if (!trimmed) return trimmed;

  const rawKey = trimmed.replace(/^[^a-z0-9]+|[^a-z0-9-]+$/gi, "").toLowerCase();
  if (UPPERCASE_TOKENS.has(rawKey)) return trimmed.toUpperCase();

  // Códigos/modelos alfanuméricos: conservar en mayúsculas (ej: 15AMN7, R7-7730U).
  if (/\d/.test(trimmed)) return trimmed.toUpperCase();

  // Si está separado por /, capitalizamos cada parte textual.
  if (trimmed.includes("/")) {
    return trimmed
      .split("/")
      .map((part) => normalizeToken(part))
      .join("/");
  }

  return capitalizeWord(trimmed);
}

export function normalizeProductName(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((token) => normalizeToken(token))
    .join(" ");
}
