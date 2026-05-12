import Papa from "papaparse";

const MATRIC_RE = /^\d{6}$/;

export function parseMatricCsv(text: string): { valid: string[]; invalid: string[] } {
  const result = Papa.parse<string[]>(text, { header: false, skipEmptyLines: true });
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const row of result.data) {
    const value = String(row[0] ?? "").trim();
    if (!value || value.toLowerCase() === "matric") continue;
    if (MATRIC_RE.test(value)) {
      valid.push(value);
    } else {
      invalid.push(value);
    }
  }
  return { valid, invalid };
}
