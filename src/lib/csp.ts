import { staticText } from "@david/console-static-text";
import { delay } from "@std/async/delay";
import { initBoard } from "./utils.ts";

export type RuleCtx<V extends string, TCSP extends CSP<V>> = {
  arr: (V | null)[][];
  r: number;
  rowL: number;
  c: number;
  colL: number;
  v: V;
  csp: TCSP;
};
export type RuleFn<V extends string, TCSP extends CSP<V>> = (
  a: RuleCtx<V, TCSP>
) => { valid: boolean; jump?: [number, number] };

export const logFailedRule =
  <V extends string, TCSP extends CSP<V>>(
    active: boolean,
    msgFn: (a: RuleCtx<V, TCSP>) => string,
    fn: RuleFn<V, TCSP>
  ): RuleFn<V, TCSP> =>
  (a) => {
    const res = fn(a);
    if (active && !res) {
      a.csp.printScope.logAbove(msgFn(a));
    }
    return res;
  };

export const onRowEnd =
  <V extends string, TCSP extends CSP<V>>(
    fn: RuleFn<V, TCSP>
  ): RuleFn<V, TCSP> =>
  (a) => {
    if (a.c === a.csp.a.colLength - 1) {
      return fn(a);
    }
    return { valid: true };
  };

// export type CSPAction<V> = {
//   arr: (number | null)[][];
//   r: number;
//   c: number;
//   apply: () => void;
//   undo: () => void;
// };

export abstract class CSP<V extends string = string> {
  arr: (number | null)[][] = [];
  arrV: (V | null)[][] = [];
  rules: RuleFn<V, any>[] = [];
  // actions: CSPAction<V>[] = [];
  printScope = staticText.createScope();
  emptyText = ".";
  spacer = " ";
  delay = 0;
  printEvery = 100;
  state = {
    step: 0,
    pointer: 0,
  };
  //? I hate that I can't set this as `Record<V, number>` type.
  reverseValueMap: Record<string, number> = {
    test: 1,
  };

  constructor(
    public a: {
      rowLength: number;
      colLength: number;
      values: V[];
      fixedValues?: (V | null)[][];
    }
  ) {
    a.values.forEach((value, key) => {
      this.reverseValueMap[value] = key;
    });
    this.arr = initBoard(a.rowLength, a.colLength, (r, c) =>
      this.getI(a.fixedValues?.[r][c] ?? null)
    );
    this.arrV = initBoard(
      a.rowLength,
      a.colLength,
      (r, c) => a.fixedValues?.[r][c] ?? null
    );
    this.printScope.setText([
      () => `Iteration: ${this.state.step}`,
      () =>
        this.arrV
          .map((colVs) =>
            colVs.map((colV) => colV ?? this.emptyText).join(this.spacer)
          )
          .join("\n"),
    ]);
  }

  updateArr(r: number, c: number, vi: number | null) {
    this.arr[r][c] = vi;
    this.arrV[r][c] = this.getV(vi);
  }

  getV(i: number | null): V | null {
    return i !== null ? this.a.values[i] : null;
  }

  getV_(i: number): V {
    return this.a.values[i];
  }

  getI(v: V | null): number | null {
    return v ? this.reverseValueMap[v] : null;
  }

  getI_(v: V): number {
    return this.reverseValueMap[v];
  }

  refreshLog(force = false) {
    if (force || this.state.step % this.printEvery === 0) {
      this.printScope.refresh();
    }
  }

  getRC() {
    const r = Math.floor(this.state.pointer / this.a.colLength);
    const c = this.state.pointer % this.a.colLength;

    return [r, c] as const;
  }

  step() {
    const valueLength = this.a.values.length;
    ++this.state.step;
    const [r, c] = this.getRC();
    const curri = this.arr[r][c];
    const nexti = curri == null ? 0 : curri + 1;
    if (nexti === valueLength) {
      this.updateArr(r, c, null);
      return "backward";
    }
    this.updateArr(r, c, nexti);
    for (const ruleFn of this.rules) {
      const { valid, jump } = ruleFn({
        arr: this.arrV,
        r,
        rowL: this.a.rowLength,
        c,
        colL: this.a.colLength,
        v: this.getV_(nexti),
        csp: this,
      });
      if (!valid) {
        if (jump) {
          const [rnext, cnext] = jump;
          this.backwardTo(rnext, cnext);
        }
        return "fail";
      }
    }
    return "forward";
  }

  backwardTo(rnext: number, cnext: number) {
    const pnext = rnext * this.a.colLength + cnext;
    while (this.state.pointer > pnext) {
      this.backward();
    }
  }

  getBoardSize() {
    return this.a.rowLength * this.a.colLength;
  }

  forward() {
    const boardSize = this.getBoardSize();
    while (true) {
      ++this.state.pointer;
      const [r, c] = this.getRC();
      if (this.state.pointer === boardSize) {
        break;
      }
      const fV = this.a.fixedValues?.[r][c] ?? null;
      if (fV === null) {
        break;
      }
    }
  }

  backward() {
    while (true) {
      --this.state.pointer;
      const [r, c] = this.getRC();
      if (this.state.pointer === -1) {
        break;
      }
      const fV = this.a.fixedValues?.[r][c] ?? null;
      if (fV === null) {
        break;
      }
    }
  }

  async run() {
    const boardSize = this.getBoardSize();

    let valid = false;
    while (true) {
      this.refreshLog();
      await delay(this.delay);
      const result = this.step();
      if (result === "forward") {
        this.forward();
        if (this.state.pointer === boardSize) {
          valid = true;
          break;
        }
        continue;
      } else if (result === "backward") {
        this.backward();
        if (this.state.pointer === -1) {
          break;
        }
        continue;
      } else if (result === "fail") {
        continue;
      }
    }
    this.refreshLog(true);
    console.log();
    return valid;
  }
}
