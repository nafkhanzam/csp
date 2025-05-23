import range, { RangeParams } from "@korkje/range";

export const ranged = (...params: RangeParams) => [...range(...params)];

export const initBoard = <V>(
  rowLength: number,
  colLength: number,
  defaultFn?: (r: number, c: number) => V | null
): (V | null)[][] =>
  [...range(rowLength)].map((_, r) =>
    [...range(colLength)].map((_, c) => defaultFn?.(r, c) ?? null)
  );
