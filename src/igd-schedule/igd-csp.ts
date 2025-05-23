import { CSP, RuleFn } from "../lib/csp.ts";

export const jagaVs = [
  "P", // Pagi
  "S", // Sore
  "M", // Malam
] as const;
export const posisiVs = [
  "H", // Kuning-Hijau
  "h", // Kuning-Hijau Merah
  "m", // Merah (Code Blue) / Merah-Kuning
  "b", // Biru
] as const;
export const igdVs = [...jagaVs, ...posisiVs];
export type IGDV = (typeof igdVs)[number];

export const defaultRules: RuleFn<IGDV>[] = [
  //
  ({}) => {
    return true;
  },
];

export class IGDCSP extends CSP<IGDV> {
  constructor(a: { days: number; doctorCount: number }) {
    super({
      colLength: a.days,
      rowLength: a.doctorCount * 2,
      values: igdVs,
    });
    this.rules.push(...defaultRules);
  }
}
