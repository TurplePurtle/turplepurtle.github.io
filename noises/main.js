// @ts-check
import { formantTable } from "./formants.js";

const ctx = new AudioContext();

/**
 * @param {AudioContext} ctx 
 * @param {typeof formantTable[0]} entry 
 */
function makeNoise(ctx, entry) {
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";

  const bands = entry.formants.map(({ freq, gain, bw }) => {
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    filter.gain.value = gain;
    filter.Q.value = freq / bw;
    return filter;
  });

  bands.forEach(filter => {
    osc.connect(filter);
    filter.connect(ctx.destination);
  });

  const baseFreq = entry.baseFreq;
  const now = ctx.currentTime;
  [0, 0.1, 0.3, 0.5].forEach(t => {
    const f = baseFreq * (0.5 + Math.random());
    osc.frequency.exponentialRampToValueAtTime(f, now + t);
  });

  osc.addEventListener("ended", () => {
    bands.forEach(filter => {
      filter.disconnect();
    });
  });

  osc.start(now);
  osc.stop(now + 0.5);
}

function makeRandomNoise() {
  makeNoise(ctx, formantTable[(Math.random() * formantTable.length) | 0]);
}

document
  .querySelector("#make-random-noise")
  .addEventListener("click", makeRandomNoise);
