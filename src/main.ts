import {IGDCSP, JagaV} from "./igd-schedule/igd-csp.ts";
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

//? /* 4*/ "dr. Fauqi Amalia",
r = 4;
// prettier-ignore
fV[r] = ["L", "P", "M", "M", "L", "L", "L", "P", "S", "S", "M", "M", "L", "L", "P", "P", "S", "M", "M", "L", "L", "P", "P", "S", "M", "M", "L", "P", "P", "L"];

//? DR. FAHMI
// 27.28.29 LIBUR
ranged(27, 29 + 1).forEach((i) => (fV[10][i] = "L"));

// DR. CITRA
r = 13;
// 21, 28 LIBUR
fV[r][21 - 1] = "L";
fV[r][28 - 1] = "L";

// DR. HELVIANSYAH
const R = 3;
r = 4;
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
// TODO: Cuti
fV[r][13 - 1] = "L";
fV[r][14 - 1] = "L";
fV[r][20 - 1] = "L";
fV[r][21 - 1] = "L";

// DR. WINDA
r = 6;
// malam : tiap jumat dan sabtu
// libur : 8, 9, 21
// cuti : 1,22, 27
// BANYAKIN JAGA SORE
// TODO: Cuti
fV[r][8 - 1] = "L";
fV[r][9 - 1] = "L";
fV[r][21 - 1] = "L";

// DR. GHANI
r = 5;
// 11: CUTI 3
// 12 - 13 = L L
// 19 - 20 = L L
// 26 - 27 = L L
// CUTI 4, 5, 6 TERSERAH TANGGAL BERAPA
// 16-30 SELALU PAGI
// TODO: Cuti
ranged(15, 30).forEach((i) => (fV[r][i - 1] = "P"));
[12, 13, 19, 20, 26, 27].forEach((i) => (fV[r][i - 1] = "L"));

// DR. ARDHA
r = 8;
// 1 Juni : libur
// 2 Juni : Cuti 4
// 6 Juni : Cuti 5
// 7-8 Juni : libur (Qurban di Kediri)
// 9 Juni : Pagi
// 10 Juni : Cuti 6 ( mendampingi outdoor learning anak)
// 20-21 Juni : libur
// 25 Juni : libur
// TODO: Cuti
[1, 7, 8, 20, 21, 25].forEach((i) => (fV[r][i - 1] = "L"));
fV[r][9 - 1] = "P";

// DR. DYAS
r = 2;
// Tiap selasa pagi
// Tiap kamis jumat malam  (JANGAN DI FULL ACC)
// Khusus untuk tgl :
// Tgl 1 libur
// Tgl 19-21 cuti
// Tgl 22 libur
// TODO: Cuti
fV[r][1 - 1] = "L";
ranged(2, 30, 7).forEach((i) => (fV[r][i] = "P"));

const csp = new IGDCSP({
  days,
  doctorCount,
  weekOn1: 0, // Minggu
  fixedValues: fV,
  additionalRules: rules,
});
// csp.printEvery = IS_DEBUG ? 1 : 100_000;
// csp.runBruteForce();

csp.printEvery = IS_DEBUG ? 1 : 100;
const found = csp.runLocalSearch(10_000_000);
if (found) {
  console.log(`Exited because solution has been found.`);
} else {
  console.log(`Exited because reached maximum iteration.`);
}
