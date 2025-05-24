import {stringify, type DataItem} from "@std/csv/stringify";
import {IGDCSP, JagaV, mapToHour} from "./igd-schedule/igd-csp.ts";
import {logFailedRule, RuleFn} from "./lib/csp.ts";
import {initBoard, IS_DEBUG, ranged} from "./lib/utils.ts";

const doctors: string[] = [
  /* 0*/ "dr. Desy Irviana Harahap",
  /* 1*/ "dr. Rahmawati",
  /* 2*/ "dr. Dyas Alif  Fitriana",
  // "dr. Brianka Yudha Nurpradika",
  /* 3*/ "dr. Helviansyah El Farizqi",
  /* 4*/ "dr. Fauqi Amalia",
  /* 5*/ "dr. Muhammad Almy Firasghani",
  /* 6*/ "dr. Winda Cornelia Harini",
  /* 7*/ "dr. Wijanarko Permadi",
  /* 8*/ "dr. Zubaity Ardha",
  /* 9*/ "dr. Dasarina Rizki Amalia",
  /*10*/ "dr. Fahmi Mohammad Bachtiar",
  /*11*/ "dr. Maharani Tontowi",
  /*12*/ "dr. Mergerizka Amiko Kapindo",
  /*13*/ "dr. Amalia Citra Octavia",
];

const days = 30; // Juni
const doctorCount = doctors.length;
const fV: (JagaV | null)[][] = initBoard(doctorCount, days);
const rules: RuleFn<JagaV, IGDCSP>[] = [];

let r = 0;

const hdays = [1, 6, 8, 15, 22, 27, 29];
function setHolidays(vs: JagaV[]) {
  hdays.entries().forEach(([i, h]) => {
    // fV[r][h] = vs[i];
    fV[r][h - 1] = vs[i];
  });
}

//? DR. DESY
r = 0;
// prettier-ignore
fV[r] = ["L","P","P","S","S","L","P","L","P","P","S","C","M","L","L","C","P","P","S","S","L","C","P","P","S","S","M","C","L","C"]

//? DR. Rahma
r = 1;
// prettier-ignore
setHolidays("MPMMMSS".split("") as JagaV[]);

//? DR. DYAS
r = 2;
// Tiap selasa pagi
// Tiap kamis jumat malam  (JANGAN DI FULL ACC)
// Khusus untuk tgl :
// Tgl 1 libur
// Tgl 19-21 cuti
// Tgl 22 libur
fV[r][1 - 1] = "L";
ranged(19, 22).forEach((i) => (fV[r][i - 1] = "C"));
ranged(2, 30, 7).forEach((i) => (fV[r][i] = "P"));
setHolidays("LSLSLMP".split("") as JagaV[]);

//? DR. HELVIANSYAH
const R = 3;
r = 3;
// Tiap kamis S/M (pagi ke soetomo)
rules.push(
  logFailedRule(
    false,
    () => `DR. HELVIANSYAH Tiap kamis S/M (pagi ke soetomo)`,
    ({r, c, v}) => {
      if (r !== R) {
        return {valid: true};
      }
      const isThu = c % 7 === 4;
      if (!isThu) {
        return {valid: true};
      }
      return {valid: v === "S" || v === "M"};
    },
  ),
);
// 13,14 L 15 C5 ( kemungkinan ujian tulis)
// 20,21 L 22 C6 (kemungkinan wawancara)
[15, 22].forEach((i) => (fV[r][i - 1] = "C"));
fV[r][13 - 1] = "L";
fV[r][14 - 1] = "L";
fV[r][20 - 1] = "L";
fV[r][21 - 1] = "L";
setHolidays("PLPCCLS".split("") as JagaV[]);

//? /* 4*/ "dr. Fauqi Amalia",
r = 4;
// prettier-ignore
fV[r] = ["L", "P", "M", "M", "L", "L", "L", "P", "S", "S", "M", "M", "L", "L", "P", "P", "S", "M", "M", "L", "L", "P", "P", "S", "M", "M", "L", "P", "P", "L"];

//? DR. GHANI
r = 5;
// 11: CUTI 3
// 12 - 13 = L L
// 19 - 20 = L L
// 26 - 27 = L L
// CUTI 4, 5, 6 TERSERAH TANGGAL BERAPA --> Dari uqik: 11, 22, 26, 29
// 16-30 SELALU PAGI
[11, 22, 26, 29].forEach((i) => (fV[r][i - 1] = "C"));
ranged(15, 30).forEach((i) => (fV[r][i - 1] = "P"));
[12, 13, 19, 20, 26, 27].forEach((i) => (fV[r][i - 1] = "L"));
setHolidays("SLLPCLC".split("") as JagaV[]);

//? DR. WINDA
r = 6;
// malam : tiap jumat dan sabtu
// libur : 8, 9, 21
// cuti : 1,22, 27
// BANYAKIN JAGA SORE
[1, 22, 27].forEach((i) => (fV[r][i - 1] = "C"));
fV[r][8 - 1] = "L";
fV[r][9 - 1] = "L";
fV[r][21 - 1] = "L";
setHolidays("CMLLCCM".split("") as JagaV[]);

//? Dr. Wijanarko
// 25 Cuti 5
// 26 Cuti 6
r = 7;
fV[r][25 - 1] = "C";
fV[r][26 - 1] = "C";
setHolidays("MPPPPSM".split("") as JagaV[]);
ranged(15).map((i) => (fV[r][i] = "P"));

//? DR. ARDHA
r = 8;
// 1 Juni : libur
// 2 Juni : Cuti 4
// 6 Juni : Cuti 5
// 7-8 Juni : libur (Qurban di Kediri)
// 9 Juni : Pagi
// 10 Juni : Cuti 6 ( mendampingi outdoor learning anak)
// 20-21 Juni : libur
// 25 Juni : libur
[2, 6, 10].forEach((i) => (fV[r][i - 1] = "C"));
[1, 7, 8, 20, 21, 25].forEach((i) => (fV[r][i - 1] = "L"));
fV[r][9 - 1] = "P";
setHolidays("LMLMSPM".split("") as JagaV[]);

//? Dr. Dasarina
// 4  libur kontrol penyakit dalam
// 27 pagi
// 28 libur
// 29 cuti 5
// 30 cuti 6
r = 9;
fV[r][14 - 1] = "L";
fV[r][27 - 1] = "P";
fV[r][28 - 1] = "L";
fV[r][29 - 1] = "C";
fV[r][30 - 1] = "C";
setHolidays("SPSSMPC".split("") as JagaV[]);

//? DR. FAHMI
r = 10;
// 27.28.29 LIBUR
// ranged(27, 29 + 1).forEach((i) => (fV[10][i] = "L"));
// prettier-ignore
fV[r] = ["M","L","S","P","P","S","S","M","L","L","P","S","S","M","L","S","P","S","S","S","S","M","L","S","P","P","L","L","L","P"]

//? DR. MAHARANI
r = 11;
fV[r][14 - 1] = "L";
setHolidays("PMSLPSP".split("") as JagaV[]);

//? DR. Niko
r = 12;
// prettier-ignore
setHolidays("PLSMSPP".split("") as JagaV[]);

//? DR. CITRA
r = 13;
// 21, 28 LIBUR
fV[r][21 - 1] = "L";
fV[r][28 - 1] = "L";
setHolidays("SSMSSMS".split("") as JagaV[]);
// prettier-ignore
// fV[r] = ["S","S","P","L","P","S","M","M","L","L","S","S","P","S","S","M","M","L","L","M","L","S","P","M","L","L","M","L","S","P"]

const csp = new IGDCSP({
  days,
  doctorCount,
  weekOn1: 0, // Minggu
  fixedValues: fV,
  additionalRules: rules,
});

// Deno.addSignalListener("SIGINT", () => {
//   csp.state.signalExit = true;
//   console.log("Received Ctrl+C, shutting down gracefully...");
//   const dataItems: DataItem[] = csp.arrV
//     .map((v) => [v, ranged(days).map(() => ""), v.map((row) => mapToHour(row))])
//     .flat();
//   Deno.writeTextFileSync("output.csv", stringify(dataItems, {bom: true, headers: false}));
//   Deno.exit(0);
// });

csp.printEvery = IS_DEBUG ? 1 : 100_000;
const found = csp.runBruteForce();

// csp.printEvery = IS_DEBUG ? 1 : 100;
// const found = csp.runLocalSearch(10_000_000);
if (found) {
  console.log(`Exited because solution has been found.`);
} else {
  console.log(`Exited because reached maximum iteration.`);
}
