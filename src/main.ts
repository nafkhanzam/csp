import { IGDCSP, JagaV } from "./igd-schedule/igd-csp.ts";
import { initBoard } from "./lib/utils.ts";

const doctors: string[] = [
  /* 0*/ "dr Fauqi Amalia",
  /* 1*/ "dr. Desy Irviana Harahap",
  /* 2*/ "dr. Rahmawati",
  /* 3*/ "dr Dyas Alif  Fitriana",
  // "dr Brianka Yudha Nurpradika",
  /* 4*/ "dr Helviansyah El Farizqi",
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

const fV: (JagaV | null)[][] = initBoard(doctors.length, 30);
fV[0] = ["L", "P", "M", "M", "L", "L", "L", "P", "S", "S", "M", "M", "L", "L", "P", "P", "S", "M", "M", "L", "L", "P", "P", "S", "M", "M", "L", "P", "P", "L"];

const csp = new IGDCSP({
  days: 30, // Juni
  doctorCount: doctors.length,
  weekOn1: 0, // Minggu
  fixedValues: fV,
});

csp.run();
