export interface PTOEntry {
  id: string;
  date: string; // ISO date string: "YYYY-MM-DD"
  note?: string;
  is_half_day: boolean;
  created_at: string;
}

export interface PTOEntryInsert {
  date: string;
  note?: string;
  is_half_day?: boolean;
}

export interface PTOEntryUpdate {
  date?: string;
  note?: string;
  is_half_day?: boolean;
}

export const PTO_ANNUAL_LIMIT = 26;

/** Returns the PTO value for a single entry: 0.5 for half-day, 1.0 for full day. */
export function ptoValue(entry: Pick<PTOEntry, "is_half_day">): number {
  return entry.is_half_day ? 0.5 : 1.0;
}

/** Sums total PTO days used from a list of entries. */
export function totalPTOUsed(entries: Pick<PTOEntry, "is_half_day">[]): number {
  return entries.reduce((sum, e) => sum + ptoValue(e), 0);
}

/** Returns remaining PTO days from the annual limit. */
export function ptoRemaining(entries: Pick<PTOEntry, "is_half_day">[]): number {
  return PTO_ANNUAL_LIMIT - totalPTOUsed(entries);
}
