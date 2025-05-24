import {IGDCSP, JagaV} from "./igd-schedule/igd-csp.ts";
import {logFailedRule} from "./lib/csp.ts";
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

const csp = new IGDCSP({
  days,
  doctorCount,
  weekOn1: 0, // Minggu
  fixedValues: fV,
});

//? /* 4*/ "dr. Fauqi Amalia",
// prettier-ignore
fV[4] = ["L", "P", "M", "M", "L", "L", "L", "P", "S", "S", "M", "M", "L", "L", "P", "P", "S", "M", "M", "L", "L", "P", "P", "S", "M", "M", "L", "P", "P", "L"];

//? DR. FAHMI
// 27.28.29 LIBUR
ranged(26, 29).forEach((i) => (fV[10][i] = "L"));

// DR. CITRA
// 21, 28 LIBUR
fV[13][20] = "L";
fV[13][27] = "L";

// DR. HELVIANSYAH
// Tiap kamis S/M (pagi ke soetomo)
csp.rules.push(
  logFailedRule(
    false,
    () => `DR. HELVIANSYAH Tiap kamis S/M (pagi ke soetomo)`,
    ({}) => {},
  ),
);
ranged(4, 30, 7).forEach((i) => (fV[3][i] = "S"));
// 13,14 L 15 C5 ( kemungkinan ujian tulis)
// 20,21 L 22 C6 (kemungkinan wawancara)

csp.printEvery = IS_DEBUG ? 1 : 100_000;

csp.run();
