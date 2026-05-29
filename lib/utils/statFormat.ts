import type { StatDefinition } from "@/types";

export type StatValueFormat = "number" | "unit" | "height_ft_in";

export function formatStatValue(value: number | null | undefined, stat: Pick<StatDefinition, "unit_label" | "value_format">): string {
  if (value == null || Number.isNaN(Number(value))) return "-";

  const numeric = Number(value);
  if (stat.value_format === "height_ft_in") {
    const totalInches = Math.max(0, Math.round(numeric));
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return `${feet} ft ${inches} in`;
  }

  const normalized = Number.isInteger(numeric) ? String(numeric) : String(Number(numeric.toFixed(2)));
  const unit = stat.unit_label?.trim();
  return unit ? `${normalized} ${unit}` : normalized;
}

export function heightPartsFromValue(value: number | string | null | undefined): { feet: string; inches: string } {
  if (value == null || value === "") return { feet: "", inches: "" };
  const totalInches = Math.max(0, Math.round(Number(value)));
  if (Number.isNaN(totalInches)) return { feet: "", inches: "" };
  return {
    feet: String(Math.floor(totalInches / 12)),
    inches: String(totalInches % 12),
  };
}

export function heightValueFromParts(feet: string | number, inches: string | number): number {
  const ft = Number(feet || 0);
  const inch = Number(inches || 0);
  return Math.max(0, Math.round(ft * 12 + inch));
}
