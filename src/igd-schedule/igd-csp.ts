// deno-lint-ignore-file no-unused-vars
import range from "@korkje/range";
import {CSP, logFailedRule, onRowEnd, RuleCtx, RuleFn} from "../lib/csp.ts";
import {ranged} from "../lib/utils.ts";

export const jagaVs = [
  "P", // Pagi
  "S", // Sore
  "M", // Malam
  "L", // Libur
  "C", // Cuti
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

export const mapToHour = (v: JagaV | null): number => {
  // const week = (csp.igd.weekOn1 + c) % 7;
  switch (v) {
    case null:
      return 0;
    case "C":
    case "P":
      return 7;
    case "S":
      return 6.5;
    case "M":
      return 10.5;
    case "L":
      return 0;
    default:
      throw new Error(`Shouldn't be meeting \`${v}\`. Might be because the cell is out of bound.`);
  }
};

export const defaultRules: RuleFn<JagaV, IGDCSP>[] = [
  logFailedRule(
    true,
    () => `[CELL] Cuti only comes from fixedValues.`,
    ({arr, c, colL, r, rowL, v, csp, isLocalSearch, pointer}) => {
      if (v !== "C") {
        return {valid: true};
      }
      return {valid: csp.fVatV(pointer) === "C"};
    },
  ),
  logFailedRule(
    true,
    () => `[ROW] L after M.`,
    ({arr, c, colL, r, rowL, v, csp, isLocalSearch}) => {
      if (c === 0) {
        return {valid: true};
      }
      if (arr[r][c - 1] === "M") {
        return {valid: v === "M" || v === "L"};
      }
      return {valid: true};
    },
  ),
  logFailedRule(
    true,
    () => `[ROW] M cannot be 3 in a row.`,
    ({arr, c, colL, r, rowL, v, csp, isLocalSearch}) => {
      if (v !== "M") {
        return {valid: true};
      }
      const inARow = 3;
      if (c < inARow - 1 && !isLocalSearch) {
        return {valid: true};
      }
      return {
        valid: arr[r].slice(c - inARow + 1, c).some((vc) => vc !== v),
      };
    },
  ),
  // logFailedRule(
  //   true,
  //   //? I assume
  //   () => `[ROW] P & S & L cannot be 5 in a row.`,
  //   ({arr, c, colL, r, rowL, v, csp, isLocalSearch}) => {
  //     // if (v !== "L") {
  //     //   return {valid: true};
  //     // }
  //     if (v !== "P" && v !== "S" && v !== "L") {
  //       return {valid: true};
  //     }
  //     const inARow = 5;
  //     if (c < inARow - 1 && !isLocalSearch) {
  //       return {valid: true};
  //     }
  //     return {
  //       valid: arr[r].slice(c - inARow + 1, c).some((vc) => vc !== v),
  //     };
  //   },
  // ),
  // logFailedRule(
  //   true,
  //   //? I assume
  //   () => `[ROW] P & S & L & M cannot be more than 10 in total.`,
  //   ({arr, c, colL, r, rowL, v, csp, isLocalSearch}) => {
  //     // if (v !== "L") {
  //     //   return {valid: true};
  //     // }
  //     if (v !== "P" && v !== "S" && v !== "L") {
  //       return {valid: true};
  //     }
  //     const maxTotal = 10;
  //     if (c < maxTotal - 1 && !isLocalSearch) {
  //       return {valid: true};
  //     }
  //     return {
  //       valid: arr[r].slice(0, isLocalSearch ? colL : c).filter((vc) => vc === v).length < maxTotal,
  //     };
  //   },
  // ),
  logFailedRule(
    true,
    () => `[COL] M has to be 3 or smaller so far.`,
    ({arr, c, colL, r, rowL, v, csp, isLocalSearch}) => {
      const expectedTotal = 3;
      if (r >= expectedTotal - 1 || isLocalSearch) {
        const totalM = ranged(rowL)
          .map((i) => arr[i][c])
          .filter((av) => av === "M").length;
        return {valid: totalM <= expectedTotal, jumpIfEnds: [r - 1, c]};
      }
      return {valid: true};
    },
  ),
  logFailedRule(
    true,
    () => `[COL] M has to be 3 overall.`,
    ({arr, c, colL, r, rowL, v, csp, isLocalSearch}) => {
      const expectedTotal = 3;
      if (r === rowL - 1 || isLocalSearch) {
        const totalM = ranged(rowL)
          .map((i) => arr[i][c])
          .filter((av) => av === "M").length;
        return {valid: totalM === expectedTotal, jumpIfEnds: [r - 1, c]};
      }
      return {valid: true};
    },
  ),
  logFailedRule(
    true,
    //? I assume
    () => `[COL] P have to be 3 or smaller so far.`,
    ({arr, c, colL, r, rowL, v, csp, isLocalSearch}) => {
      const expectedTotal = 3;
      if (r >= expectedTotal - 1 || isLocalSearch) {
        const total = ranged(rowL)
          .map((i) => arr[i][c])
          .filter((av) => av === "P").length;
        return {valid: total <= expectedTotal, jumpIfEnds: [r - 1, c]};
      }
      return {valid: true};
    },
  ),
  logFailedRule(
    true,
    () => `[COL] P have to be 2 or more overall.`,
    ({arr, c, colL, r, rowL, v, csp, isLocalSearch}) => {
      const expectedTotal = 2;
      if (r === rowL - 1 || isLocalSearch) {
        const total = ranged(rowL)
          .map((i) => arr[i][c])
          .filter((av) => av === "P").length;
        return {valid: total >= expectedTotal, jumpIfEnds: [r - 1, c]};
      }
      return {valid: true};
    },
  ),
  logFailedRule(
    true,
    //? I assume
    () => `[COL] S have to be 3 or smaller so far.`,
    ({arr, c, colL, r, rowL, v, csp, isLocalSearch}) => {
      const expectedTotal = 3;
      if (r >= expectedTotal - 1 || isLocalSearch) {
        const total = ranged(rowL)
          .map((i) => arr[i][c])
          .filter((av) => av === "S").length;
        return {valid: total <= expectedTotal, jumpIfEnds: [r - 1, c]};
      }
      return {valid: true};
    },
  ),
  logFailedRule(
    true,
    () => `[COL] S have to be 3 or more overall.`,
    ({arr, c, colL, r, rowL, v, csp, isLocalSearch}) => {
      const expectedTotal = 3;
      if (r === rowL - 1 || isLocalSearch) {
        const total = ranged(rowL)
          .map((i) => arr[i][c])
          .filter((av) => av === "S").length;
        return {valid: total >= expectedTotal, jumpIfEnds: [r - 1, c]};
      }
      return {valid: true};
    },
  ),
  logFailedRule(
    true,
    () => `[ROW] Total jam jaga harus antara 162.5 sampai 165.5 jam.`,
    (a) => {
      const MIN_HOURS = 162.5;
      const MAX_HOURS = 165.5;
      const {arr, c, colL, r, rowL, v, csp, isLocalSearch} = a;
      const totalHours = arr[r].reduce((prev, curr) => prev + mapToHour(curr!), 0);
      if (a.isLocalSearch || (c === a.colL - 1 && totalHours < MIN_HOURS)) {
        // const thisHour = mapToHour(a, v);
        // let nextc = c - 1;
        // while (thisHour <= mapToHour(a, a.arr[r][nextc])) {
        //   --nextc;
        // }
        // return { valid: false, jumpIfEnds: [r, nextc] };
        return {valid: false};
      }
      if (MAX_HOURS < totalHours) {
        // const thisHour = mapToHour(a, v);
        // let nextc = c - 1;
        // while (mapToHour(a, a.arr[r][nextc]) <= thisHour) {
        //   --nextc;
        // }
        // return { valid: false, jumpIfEnds: [r, nextc] };
        return {valid: false};
      }
      return {valid: true};
    },
  ),
];

export class IGDCSP extends CSP<JagaV> {
  constructor(
    public igd: {
      days: number;
      doctorCount: number;
      weekOn1: number;
      fixedValues?: (JagaV | null)[][];
      additionalRules?: RuleFn<JagaV, IGDCSP>[];
    },
  ) {
    super({
      colLength: igd.days,
      rowLength: igd.doctorCount,
      values: [...jagaVs],
      fixedValues: igd.fixedValues,
    });
    this.rules.push(...defaultRules);
    this.rules.push(...(igd.additionalRules ?? []));
  }
}
