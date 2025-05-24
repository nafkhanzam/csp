import range, {RangeParams} from "@korkje/range";

export const ranged = (...params: RangeParams) => [...range(...params)];

export const initBoard = <V>(
  rowLength: number,
  colLength: number,
  defaultFn?: (r: number, c: number) => V | null,
): (V | null)[][] =>
  [...range(rowLength)].map((_, r) =>
    [...range(colLength)].map((_, c) => defaultFn?.(r, c) ?? null),
  );

export const printTimeDifference = (date1: Date, date2: Date) => {
  const diffInMs = Math.abs(date1.getTime() - date2.getTime());

  const hours = Math.floor(diffInMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffInMs % (1000 * 60)) / 1000);

  return `${hours} hours, ${minutes} minutes, ${seconds} seconds`;
};

export const IF = <A, B>(ifV: unknown, a: A, b: B): A | B => {
  if (ifV) {
    return a;
  }
  return b;
};

export const IS_DEBUG = Deno.env.get("DEBUG") === "1";
