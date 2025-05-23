import { staticText } from "@david/console-static-text";
import range from "@korkje/range";
import { delay } from "@std/async/delay";

export type RuleFn<V> = (a: {
  arr: (V | null)[][];
  r: number;
  c: number;
  v: V;
}) => boolean | undefined | void;

// export type CSPAction<V> = {
//   arr: (number | null)[][];
//   r: number;
//   c: number;
//   apply: () => void;
//   undo: () => void;
// };

export abstract class CSP<V> {
  arr: (number | null)[][] = [];
  rules: RuleFn<V>[] = [];
  // actions: CSPAction<V>[] = [];
  printScope = staticText.createScope();
  emptyText = ".";
  spacer = " ";
  delay = 10;
  state = {
    step: 0,
    pointer: 0,
  };

  constructor(
    public a: {
      rowLength: number;
      colLength: number;
      values: V[];
    }
  ) {
    this.arr = [...range(a.rowLength)].map(() =>
      [...range(a.rowLength)].map(() => null)
    );
    this.printScope.setText([
      () => `Iteration: ${this.state.step}`,
      () =>
        this.arr
          .map((colVs) =>
            colVs.map((i) => this.getV(i) ?? this.emptyText).join(this.spacer)
          )
          .join("\n"),
    ]);
  }

  getV(i: number | null): V | null {
    return i !== null ? this.a.values[i] : null;
  }

  getV_(i: number): V {
    return this.a.values[i];
  }

  refreshLog() {
    this.printScope.refresh();
  }

  step() {
    const valueLength = this.a.values.length;
    ++this.state.step;
    const r = Math.floor(this.state.pointer / this.a.colLength);
    const c = this.state.pointer % this.a.colLength;
    const curri = this.arr[r][c];
    const nexti = curri == null ? 0 : curri + 1;
    if (nexti === valueLength) {
      this.arr[r][c] = null;
      return "backward";
    }
    this.arr[r][c] = nexti;
    for (const ruleFn of this.rules) {
      const pass = !!ruleFn({
        arr: this.arr.map((rowArr) => rowArr.map((i) => this.getV(i))),
        r,
        c,
        v: this.getV_(nexti),
      });
      if (!pass) {
        return "fail";
      }
    }
    return "forward";
  }

  async run() {
    const boardSize = this.a.rowLength * this.a.colLength;
    let valid = false;
    while (true) {
      this.refreshLog();
      await delay(this.delay);
      const result = this.step();
      if (result === "forward") {
        ++this.state.pointer;
        if (this.state.pointer === boardSize) {
          valid = true;
          break;
        }
        continue;
      } else if (result === "backward") {
        --this.state.pointer;
        if (this.state.pointer === -1) {
          break;
        }
        continue;
      } else if (result === "fail") {
        continue;
      }
    }
    this.refreshLog();
    return valid;
  }
}
