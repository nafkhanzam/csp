import {randomIntegerBetween, sample} from "@std/random";
import {staticText} from "@david/console-static-text";
import {delay} from "@std/async/delay";
import {IF, initBoard, IS_DEBUG, printTimeDifference, ranged} from "./utils.ts";
import range from "@korkje/range";

export type RuleCtx<V extends string, TCSP extends CSP<V>> = {
  arr: (V | null)[][];
  pointer: number;
  r: number;
  rowL: number;
  c: number;
  colL: number;
  v: V;
  csp: TCSP;
  isLocalSearch: boolean;
};
export type RuleFn<V extends string, TCSP extends CSP<V>> = (a: RuleCtx<V, TCSP>) => {
  valid: boolean;
  jump?: [number, number];
  jumpIfEnds?: [number, number];
};

export const logFailedRule =
  <V extends string, TCSP extends CSP<V>>(
    active: boolean,
    msgFn: (a: RuleCtx<V, TCSP>) => string,
    fn: RuleFn<V, TCSP>,
  ): RuleFn<V, TCSP> =>
  (a) => {
    const msg = msgFn(a);
    a.csp.state.currentRule = msg;
    // a.csp.refreshLog();
    const res = fn(a);
    if (active && !res.valid) {
      a.csp.incDebugCount(msg);
    }
    return res;
  };

export const onRowEnd =
  <V extends string, TCSP extends CSP<V>>(fn: RuleFn<V, TCSP>): RuleFn<V, TCSP> =>
  (a) => {
    if (a.c === a.csp.a.colLength - 1) {
      return fn(a);
    }
    return {valid: true};
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
  printEvery = 200;
  isLocalSearch = false;
  state = {
    step: 0,
    pointer: -1,
    furthest: 0,
    startTime: new Date(),
    currentRule: "",
    rulei: 0,
    conflictCount: 0,
    signalExit: false,
  };
  //? I hate that I can't set this as `Record<V, number>` type.
  reverseValueMap: Record<string, number> = {};
  countDebug: Record<string, number> = {};
  startingValueIndices: number[][] = [];

  constructor(
    public a: {
      rowLength: number;
      colLength: number;
      values: V[];
      fixedValues?: (V | null)[][];
    },
  ) {
    a.values.forEach((value, key) => {
      this.reverseValueMap[value] = key;
    });
    this.arr = initBoard(a.rowLength, a.colLength, (r, c) =>
      this.getI(a.fixedValues?.[r][c] ?? null),
    );
    this.arrV = initBoard(a.rowLength, a.colLength, (r, c) => a.fixedValues?.[r][c] ?? null);
    this.startingValueIndices = initBoard(a.rowLength, a.colLength, (r, c) => {
      const p = this.toPointer(r, c);
      return p % a.values.length;
    }) as number[][];
  }

  toPointer(r: number, c: number) {
    return r * this.a.colLength + c;
  }

  c(v = "") {
    return v.padStart(2);
  }

  incDebugCount(key: string) {
    if (!this.countDebug[key]) {
      this.countDebug[key] = 0;
    }
    ++this.countDebug[key];
  }

  updateArr(r: number, c: number, vi: number | null) {
    this.arr[r][c] = vi;
    this.arrV[r][c] = this.getV(vi);
  }

  updateArrV(r: number, c: number, v: V | null) {
    this.arr[r][c] = this.getI(v);
    this.arrV[r][c] = v;
  }

  at(pointer: number): number | null {
    const [r, c] = this.getRC(pointer);
    return this.arr[r][c];
  }

  fVat(pointer: number): number | null {
    return this.getI(this.fVatV(pointer));
  }

  fVatV(pointer: number): V | null {
    const [r, c] = this.getRC(pointer);
    return this.a.fixedValues?.[r][c] ?? null;
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

  getRC(pointer = this.state.pointer) {
    const r = Math.floor(pointer / this.a.colLength);
    const c = pointer % this.a.colLength;

    return [r, c] as const;
  }

  ruleCtx({r, c, v}: {r: number; c: number; v: V}): RuleCtx<V, any> {
    return {
      arr: this.arrV,
      pointer: this.toPointer(r, c),
      r,
      rowL: this.a.rowLength,
      c,
      colL: this.a.colLength,
      v,
      csp: this,
      isLocalSearch: this.isLocalSearch,
    };
  }

  step() {
    const valueLength = this.a.values.length;
    ++this.state.step;
    const [r, c] = this.getRC();
    const lastVariable = this.startingValueIndices[r][c];
    const curri = this.arr[r][c];
    const nexti = (curri == null ? lastVariable : curri + 1) % valueLength;
    // if (nexti === valueLength) {
    //   return "backward";
    // }
    if (curri !== null && nexti === lastVariable) {
      return "backward";
    }
    this.updateArr(r, c, nexti);
    for (const [rulei, ruleFn] of this.rules.entries()) {
      this.state.rulei = rulei;
      const v = this.getV_(nexti);
      const {valid, jump, jumpIfEnds} = ruleFn(this.ruleCtx({r, c, v}));
      if (!valid) {
        if (jump) {
          const [rnext, cnext] = jump;
          this.backwardTo(rnext, cnext);
        }
        // TODO: This should only be true IF all possible values failed within this exact rule.
        if (jumpIfEnds) {
          const [rnext, cnext] = jumpIfEnds;
          if ((nexti + 1) % valueLength === lastVariable) {
            this.backwardTo(rnext, cnext);
          }
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
    this.state.furthest = Math.max(this.state.furthest, this.state.pointer);
  }

  backward() {
    while (true) {
      {
        const [r, c] = this.getRC();
        const fV = this.a.fixedValues?.[r][c] ?? null;
        if (fV === null) {
          this.updateArr(r, c, null);
        }
      }
      --this.state.pointer;
      if (this.state.pointer === -1) {
        break;
      }
      const [r, c] = this.getRC();
      const fV = this.a.fixedValues?.[r][c] ?? null;
      if (fV === null) {
        break;
      }
    }
  }

  private initRun() {
    this.state.startTime = new Date();
  }

  runBruteForce() {
    this.initRun();
    this.printScope.setText([
      () => `Time spent: ${printTimeDifference(this.state.startTime, new Date())}`,
      () => `Iteration: ${this.state.step}`,
      () => `Furthest: [${this.getRC(this.state.furthest)}]`,
      ...IF(IS_DEBUG, [() => `Current Rule: ${this.state.currentRule}`], []),
      () => {
        const max = Math.max(...Object.values(this.countDebug)).toString().length;
        return Object.entries(this.countDebug)
          .map(([key, value]) => `[${value.toString().padStart(max)}] ${key}`)
          .join("\n");
      },
      () =>
        this.c() +
        this.spacer +
        ranged(this.a.colLength)
          .map((v) => this.c(String(v)))
          .join(this.spacer),
      () =>
        this.arrV
          .map(
            (colVs, row) =>
              this.c(String(row)) +
              this.spacer +
              colVs
                .map((colV) => colV ?? this.emptyText)
                .map((v) => this.c(v))
                .join(this.spacer),
          )
          .join("\n"),
      `=`.repeat((this.c("").length + this.spacer.length) * (this.a.colLength + 1)),
      `.`,
    ]);
    const boardSize = this.getBoardSize();

    let valid = false;
    try {
      this.forward();
      while (true && !this.state.signalExit) {
        this.refreshLog();
        // await delay(this.delay);
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
    } catch (error) {
      throw error;
    } finally {
      this.refreshLog(true);
    }
    return valid;
  }

  countConflict(pointer: number): number {
    const [r, c] = this.getRC(pointer);
    const v = this.arrV[r][c];
    if (v === null) {
      return Infinity;
    }
    let res = 0;
    for (const [rulei, ruleFn] of this.rules.entries()) {
      this.state.rulei = rulei;
      const {valid} = ruleFn(this.ruleCtx({r, c, v}));
      if (!valid) {
        ++res;
      }
    }
    return res;
  }

  findConflictCell(): number | undefined {
    const boardSize = this.getBoardSize();
    const conflictMap = ranged(boardSize);
    for (const pointer of range(boardSize)) {
      const fV = this.fVat(pointer);
      if (fV !== null) {
        conflictMap[pointer] = 0;
      } else {
        conflictMap[pointer] = this.countConflict(pointer);
      }
    }
    const filtered = [...conflictMap.entries().filter(([_, v]) => v > 0)];
    const sampled = filtered[randomIntegerBetween(0, filtered.length - 1)][0];
    // const sampled = filtered.reduce((prev, curr) => {
    //   if (!prev || curr[1] < prev[1]) {
    //     return curr;
    //   }
    //   return prev;
    // });
    if (sampled === undefined) {
      return sampled;
    }
    return sampled;
  }

  findMinConflictDomain(pointer: number): number {
    const [r, c] = this.getRC(pointer);
    const oldVi = this.at(pointer);
    let minConflict = this.countConflict(pointer);
    let chosenVi = oldVi ?? 0;
    for (const vi of range(this.a.values.length)) {
      if (vi === oldVi) {
        continue;
      }
      this.updateArr(r, c, vi);
      const newConflict = this.countConflict(vi);
      if (newConflict < minConflict) {
        minConflict = newConflict;
        chosenVi = vi;
      }
    }
    this.updateArr(r, c, oldVi);
    return chosenVi;
  }

  runLocalSearch(maxIteration: number) {
    this.initRun();
    this.isLocalSearch = true;
    let iteration = 0;
    this.printScope.setText([
      () => `Time spent: ${printTimeDifference(this.state.startTime, new Date())}`,
      () => `Iteration: ${iteration}`,
      ...IF(IS_DEBUG, [() => `Current Rule: ${this.state.currentRule}`], []),
      () => {
        const max = Math.max(...Object.values(this.countDebug)).toString().length;
        return Object.entries(this.countDebug)
          .map(([key, value]) => `[${value.toString().padStart(max)}] ${key}`)
          .join("\n");
      },
      () =>
        this.c() +
        this.spacer +
        ranged(this.a.colLength)
          .map((v) => this.c(String(v)))
          .join(this.spacer),
      () =>
        this.arrV
          .map(
            (colVs, row) =>
              this.c(String(row)) +
              this.spacer +
              colVs
                .map((colV) => colV ?? this.emptyText)
                .map((v) => this.c(v))
                .join(this.spacer),
          )
          .join("\n"),
      `=`.repeat((this.c().length + this.spacer.length) * (this.a.colLength + 1)),
      `.`,
    ]);
    const boardSize = this.getBoardSize();
    for (const i of range(boardSize)) {
      const [r, c] = this.getRC(i);
      const fixedV = this.a.fixedValues?.[r][c];
      if (fixedV) {
        this.updateArrV(r, c, fixedV);
        continue;
      }
      const vi =
        this.startingValueIndices?.[r][c] ?? randomIntegerBetween(0, this.a.values.length - 1);
      this.updateArr(r, c, vi);
    }

    let valid = false;
    try {
      while (++iteration <= maxIteration && !this.state.signalExit) {
        ++this.state.step;
        this.refreshLog();
        const pointer = this.findConflictCell();
        if (pointer === undefined) {
          valid = true;
          break;
        }
        const chosenVi = this.findMinConflictDomain(pointer);
        const [r, c] = this.getRC(pointer);
        this.updateArr(r, c, chosenVi);
      }
    } catch (error) {
      throw error;
    } finally {
      this.refreshLog(true);
    }
    return {found: valid, iteration};
  }
}
