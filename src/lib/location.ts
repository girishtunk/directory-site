export function formatLocationParts(...parts: Array<string | undefined>) {
  const seen = new Set<string>();
  const values: string[] = [];

  for (const part of parts) {
    const value = part?.trim();

    if (!value) {
      continue;
    }

    const key = value.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    values.push(value);
  }

  return values.join(", ");
}

export function firstUniqueValue(
  primaryParts: Array<string | undefined>,
  fallbackParts: Array<string | undefined>
) {
  const used = new Set(
    primaryParts
      .map((part) => part?.trim().toLowerCase())
      .filter(Boolean) as string[]
  );

  for (const part of fallbackParts) {
    const value = part?.trim();

    if (!value || used.has(value.toLowerCase())) {
      continue;
    }

    return value;
  }

  return "";
}
