function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

function formatAsDateOnly(value: Date): string {
  const year = value.getFullYear();
  const month = pad2(value.getMonth() + 1);
  const day = pad2(value.getDate());
  return `${year}-${month}-${day}`;
}

export function toDateOnlyString(value: unknown): string {
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return formatAsDateOnly(parsed);
    }
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatAsDateOnly(value);
  }

  throw new Error("Invalid date-only value");
}
