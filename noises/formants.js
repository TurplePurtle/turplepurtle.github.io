// @ts-check

/** @typedef {{freq: number, gain: number, bw: number}} FormantProps */
/** @typedef {{name: string, baseFreq: number, formants: FormantProps[]}} FormantEntry */

/** @type {FormantEntry[]} */
export const formantTable = [
  {
    name: "soprano a",
    baseFreq: 440,
    formants: [
      { freq: 800, gain: 0, bw: 80 },
      { freq: 1150, gain: -6, bw: 90 },
      { freq: 2900, gain: -32, bw: 120 },
      { freq: 3900, gain: -20, bw: 130 },
      { freq: 4950, gain: -50, bw: 140 },
    ],
  },
  {
    name: "soprano e",
    baseFreq: 440,
    formants: [
      { freq: 350, gain: 0, bw: 60 },
      { freq: 2000, gain: -20, bw: 100 },
      { freq: 2800, gain: -15, bw: 120 },
      { freq: 3600, gain: -40, bw: 150 },
      { freq: 4950, gain: -56, bw: 200 },
    ],
  },
  {
    name: "soprano i",
    baseFreq: 440,
    formants: [
      { freq: 270, gain: 0, bw: 60 },
      { freq: 2140, gain: -12, bw: 90 },
      { freq: 2950, gain: -26, bw: 100 },
      { freq: 3900, gain: -26, bw: 120 },
      { freq: 4950, gain: -44, bw: 120 },
    ],
  },
  {
    name: "soprano o",
    baseFreq: 440,
    formants: [
      { freq: 450, gain: 0, bw: 70 },
      { freq: 800, gain: -11, bw: 80 },
      { freq: 2830, gain: -22, bw: 100 },
      { freq: 3800, gain: -22, bw: 130 },
      { freq: 4950, gain: -50, bw: 135 },
    ],
  },
  {
    name: "soprano u",
    baseFreq: 440,
    formants: [
      { freq: 325, gain: 0, bw: 50 },
      { freq: 700, gain: -16, bw: 60 },
      { freq: 2700, gain: -35, bw: 170 },
      { freq: 3800, gain: -40, bw: 180 },
      { freq: 4950, gain: -60, bw: 200 },
    ],
  },
  {
    name: "alto a",
    baseFreq: 349,
    formants: [
      { freq: 800, gain: 0, bw: 80 },
      { freq: 1150, gain: -4, bw: 90 },
      { freq: 2800, gain: -20, bw: 120 },
      { freq: 3500, gain: -36, bw: 130 },
      { freq: 4950, gain: -60, bw: 140 },
    ],
  },
  {
    name: "alto e",
    baseFreq: 349,
    formants: [
      { freq: 400, gain: 0, bw: 60 },
      { freq: 1600, gain: -24, bw: 80 },
      { freq: 2700, gain: -30, bw: 120 },
      { freq: 3300, gain: -35, bw: 150 },
      { freq: 4950, gain: -60, bw: 200 },
    ],
  },
  {
    name: "alto i",
    baseFreq: 349,
    formants: [
      { freq: 350, gain: 0, bw: 50 },
      { freq: 1700, gain: -20, bw: 100 },
      { freq: 2700, gain: -30, bw: 120 },
      { freq: 3700, gain: -36, bw: 150 },
      { freq: 4950, gain: -60, bw: 200 },
    ],
  },
  {
    name: "alto o",
    baseFreq: 349,
    formants: [
      { freq: 450, gain: 0, bw: 70 },
      { freq: 800, gain: -9, bw: 80 },
      { freq: 2830, gain: -16, bw: 100 },
      { freq: 3500, gain: -28, bw: 130 },
      { freq: 4950, gain: -55, bw: 135 },
    ],
  },
  {
    name: "alto u",
    baseFreq: 349,
    formants: [
      { freq: 325, gain: 0, bw: 50 },
      { freq: 700, gain: -12, bw: 60 },
      { freq: 2530, gain: -30, bw: 170 },
      { freq: 3500, gain: -40, bw: 180 },
      { freq: 4950, gain: -64, bw: 200 },
    ],
  },
  {
    name: "countertenor a",
    baseFreq: 330,
    formants: [
      { freq: 660, gain: 0, bw: 80 },
      { freq: 1120, gain: -6, bw: 90 },
      { freq: 2750, gain: -23, bw: 120 },
      { freq: 3000, gain: -24, bw: 130 },
      { freq: 3350, gain: -38, bw: 140 },
    ],
  },
  {
    name: "countertenor e",
    baseFreq: 330,
    formants: [
      { freq: 440, gain: 0, bw: 70 },
      { freq: 1800, gain: -14, bw: 80 },
      { freq: 2700, gain: -18, bw: 100 },
      { freq: 3000, gain: -20, bw: 120 },
      { freq: 3300, gain: -20, bw: 120 },
    ],
  },
  {
    name: "countertenor i",
    baseFreq: 330,
    formants: [
      { freq: 270, gain: 0, bw: 40 },
      { freq: 1850, gain: -24, bw: 90 },
      { freq: 2900, gain: -24, bw: 100 },
      { freq: 3350, gain: -36, bw: 120 },
      { freq: 3590, gain: -36, bw: 120 },
    ],
  },
  {
    name: "countertenor o",
    baseFreq: 330,
    formants: [
      { freq: 430, gain: 0, bw: 40 },
      { freq: 820, gain: -10, bw: 80 },
      { freq: 2700, gain: -26, bw: 100 },
      { freq: 3000, gain: -22, bw: 120 },
      { freq: 3300, gain: -34, bw: 120 },
    ],
  },
  {
    name: "countertenor u",
    baseFreq: 330,
    formants: [
      { freq: 370, gain: 0, bw: 40 },
      { freq: 630, gain: -20, bw: 60 },
      { freq: 2750, gain: -23, bw: 100 },
      { freq: 3000, gain: -30, bw: 120 },
      { freq: 3400, gain: -34, bw: 120 },
    ],
  },

  {
    name: "tenor a",
    baseFreq: 233,
    formants: [
      { freq: 1080, gain: 0, bw: 80 },
      { freq: 650, gain: -6, bw: 90 },
      { freq: 2650, gain: -7, bw: 120 },
      { freq: 2900, gain: -8, bw: 130 },
      { freq: 3250, gain: -22, bw: 140 },
    ],
  },
  {
    name: "tenor e",
    baseFreq: 233,
    formants: [
      { freq: 400, gain: 0, bw: 70 },
      { freq: 1700, gain: -14, bw: 80 },
      { freq: 2600, gain: -12, bw: 100 },
      { freq: 3200, gain: -14, bw: 120 },
      { freq: 3580, gain: -20, bw: 120 },
    ],
  },
  {
    name: "tenor i",
    baseFreq: 233,
    formants: [
      { freq: 290, gain: 0, bw: 40 },
      { freq: 1870, gain: -15, bw: 90 },
      { freq: 2800, gain: -18, bw: 100 },
      { freq: 3250, gain: -20, bw: 120 },
      { freq: 3540, gain: -30, bw: 120 },
    ],
  },
  {
    name: "tenor o",
    baseFreq: 233,
    formants: [
      { freq: 400, gain: 0, bw: 40 },
      { freq: 800, gain: -10, bw: 80 },
      { freq: 2600, gain: -12, bw: 100 },
      { freq: 2800, gain: -12, bw: 120 },
      { freq: 3000, gain: -26, bw: 120 },
    ],
  },
  {
    name: "tenor u",
    baseFreq: 233,
    formants: [
      { freq: 350, gain: 0, bw: 40 },
      { freq: 600, gain: -20, bw: 60 },
      { freq: 2700, gain: -17, bw: 100 },
      { freq: 2900, gain: -14, bw: 120 },
      { freq: 3300, gain: -26, bw: 120 },
    ],
  },
  {
    name: "bass a",
    baseFreq: 155,
    formants: [
      { freq: 600, gain: 0, bw: 60 },
      { freq: 1040, gain: -7, bw: 70 },
      { freq: 2250, gain: -9, bw: 110 },
      { freq: 2450, gain: -9, bw: 120 },
      { freq: 2750, gain: -20, bw: 130 },
    ],
  },
  {
    name: "bass e",
    baseFreq: 155,
    formants: [
      { freq: 400, gain: 0, bw: 40 },
      { freq: 1620, gain: -12, bw: 80 },
      { freq: 2400, gain: -9, bw: 100 },
      { freq: 2800, gain: -12, bw: 120 },
      { freq: 3100, gain: -18, bw: 120 },
    ],
  },
  {
    name: "bass i",
    baseFreq: 155,
    formants: [
      { freq: 250, gain: 0, bw: 60 },
      { freq: 1750, gain: -30, bw: 90 },
      { freq: 2600, gain: -16, bw: 100 },
      { freq: 3050, gain: -22, bw: 120 },
      { freq: 3340, gain: -28, bw: 120 },
    ],
  },
  {
    name: "bass o",
    baseFreq: 155,
    formants: [
      { freq: 400, gain: 0, bw: 40 },
      { freq: 750, gain: -11, bw: 80 },
      { freq: 2400, gain: -21, bw: 100 },
      { freq: 2600, gain: -20, bw: 120 },
      { freq: 2900, gain: -40, bw: 120 },
    ],
  },
  {
    name: "bass u",
    baseFreq: 155,
    formants: [
      { freq: 350, gain: 0, bw: 40 },
      { freq: 600, gain: -20, bw: 80 },
      { freq: 2400, gain: -32, bw: 100 },
      { freq: 2675, gain: -28, bw: 120 },
      { freq: 2950, gain: -36, bw: 120 },
    ],
  },
];
