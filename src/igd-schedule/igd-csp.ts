// deno-lint-ignore-file no-unused-vars
import range from "@korkje/range";
import { CSP, logFailedRule, onRowEnd, RuleCtx, RuleFn } from "../lib/csp.ts";
import { ranged } from "../lib/utils.ts";

export const jagaVs = [
  "P", // Pagi
  "S", // Sore
  "M", // Malam
  "L", // Libur/Cuti
] as const;
export const jagaVss: string[] = [...jagaVs];
export type JagaV = (typeof jagaVs)[number];
export const posisiVs = [
  "k", // Kuning-Hijau
  "h", // Kuning-Hijau Merah
  "m", // Merah (Code Blue) / Merah-Kuning
  "b", // Biru
  "l", // Libur
] as const;
export const posisiVss: string[] = [...posisiVs];
export const igdVs = [...jagaVs, ...posisiVs];
export type IGDV = (typeof igdVs)[number];

const mapToHour = (
  { arr, c, r, csp }: RuleCtx<JagaV, IGDCSP>,
  v: IGDV | null
): number => {
  // const week = (csp.igd.weekOn1 + c) % 7;
  switch (v) {
    case null:
      return 0;
    case "P":
      return 7;
    case "S":
      return 6.5;
    case "M":
      return 10.5;
    case "L":
      return 0;
    default:
      throw new Error(`Shouldn't be meeting ${v} in [c=${c},r=${r}]`);
  }
};

export const defaultRules: RuleFn<JagaV, IGDCSP>[] = [
  logFailedRule(
    false,
    () => `Libur setelah M.`,
    ({ arr, c, r, v }) => {
      if (c === 0) {
        return { valid: true };
      }
      if (arr[r][c - 1] === "M") {
        return { valid: v === "M" || v === "L" };
      }
      return { valid: true };
    }
  ),
  logFailedRule(
    false,
    () => `M cannot be 3 in a row.`,
    ({ arr, c, r, v }) => {
      if (v !== "M") {
        return { valid: true };
      }
      const inARow = 3;
      if (c < inARow - 1) {
        return { valid: true };
      }
      return {
        valid: arr[r].slice(c - inARow + 1, c).some((vc) => vc !== v),
      };
    }
  ),
  logFailedRule(
    false,
    () => `P & S cannot be 3 in a row.`,
    ({ arr, c, r, v }) => {
      if (v !== "P" && v !== "S") {
        return { valid: true };
      }
      const inARow = 3;
      if (c < inARow - 1) {
        return { valid: true };
      }
      return {
        valid: arr[r].slice(c - inARow + 1, c).some((vc) => vc !== v),
      };
    }
  ),
  logFailedRule(
    false,
    () => `M has to be 3 or smaller so far.`,
    ({ arr, c, colL, r, rowL, v, csp }) => {
      const expectedTotal = 3;
      if (r >= expectedTotal - 1) {
        const totalM = ranged(rowL)
          .map((i) => arr[i][c])
          .filter((av) => av === "M").length;
        return { valid: totalM <= expectedTotal, jump: [r - 1, c] };
      }
      return { valid: true };
    }
  ),
  logFailedRule(
    false,
    () => `M has to be 3 overall.`,
    ({ arr, c, colL, r, rowL, v, csp }) => {
      const expectedTotal = 3;
      if (r === rowL - 1) {
        const totalM = ranged(rowL)
          .map((i) => arr[i][c])
          .filter((av) => av === "M").length;
        return { valid: totalM === expectedTotal, jump: [r - 1, c] };
      }
      return { valid: true };
    }
  ),
  logFailedRule(
    false,
    () => `P & S has to be 4 or smaller so far.`,
    ({ arr, c, colL, r, rowL, v, csp }) => {
      const expectedTotal = 4;
      if (r >= expectedTotal - 1) {
        const totalM = ranged(rowL)
          .map((i) => arr[i][c])
          .filter((av) => av === "P" || av === "S").length;
        return { valid: totalM <= expectedTotal, jump: [r - 1, c] };
      }
      return { valid: true };
    }
  ),
  logFailedRule(
    false,
    () => `P & S has to be 3 or more overall.`,
    ({ arr, c, colL, r, rowL, v, csp }) => {
      const expectedTotal = 3;
      if (r === rowL - 1) {
        const totalM = ranged(rowL)
          .map((i) => arr[i][c])
          .filter((av) => av === "P" || av === "S").length;
        return { valid: totalM >= expectedTotal, jump: [r - 1, c] };
      }
      return { valid: true };
    }
  ),
  logFailedRule(
    false,
    () => `Total jam jaga harus antara 162.5 sampai 165.5 jam.`,
    (a) => {
      const MIN_HOURS = 162.5;
      const MAX_HOURS = 165.5;
      const { arr, c, r, v } = a;
      const totalHours = ranged(a.colL)
        .map((i) => arr[r][i])
        .reduce((prev, curr) => prev + mapToHour(a, curr!), 0);
      if (c === a.colL - 1 && totalHours < MIN_HOURS) {
        return { valid: false };
      }
      if (MAX_HOURS < totalHours) {
        return { valid: false };
      }
      return { valid: true };
    }
  ),
];

export class IGDCSP extends CSP<JagaV> {
  constructor(
    public igd: {
      days: number;
      doctorCount: number;
      weekOn1: number;
      fixedValues?: (JagaV | null)[][];
    }
  ) {
    super({
      colLength: igd.days,
      rowLength: igd.doctorCount,
      values: [...jagaVs],
      fixedValues: igd.fixedValues,
    });
    this.rules.push(...defaultRules);
  }
}
