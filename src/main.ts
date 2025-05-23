import { IGDCSP } from "./igd-schedule/igd-csp.ts";

const doctors: string[] = [
  /* 0*/ "dr. Desy Irviana Harahap",
  /* 1*/ "dr. Rahmawati",
  /* 2*/ "dr Dyas Alif  Fitriana",
  /* 3*/ "dr Brianka Yudha Nurpradika",
  /* 4*/ "dr Helviansyah El Farizqi",
  /* 5*/ "dr Fauqi Amalia",
  /* 6*/ "dr. Muhammad Almy Firasghani",
  /* 7*/ "dr. Winda Cornelia Harini",
  /* 8*/ "dr. Wijanarko Permadi",
  /* 9*/ "dr. Zubaity Ardha",
  /*10*/ "dr. Dasarina Rizki Amalia",
  /*11*/ "dr. Fahmi Mohammad Bachtiar",
  /*12*/ "dr. Maharani Tontowi",
  /*13*/ "dr. Mergerizka Amiko Kapindo",
  /*14*/ "dr. Amalia Citra Octavia",
];

const csp = new IGDCSP({
  days: 30, // Juni
  doctorCount: doctors.length,
});

await csp.run();
