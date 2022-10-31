const OFF = 9 / 16;

class Clock {
  /**
   * @param {SVGLineElement} line
   * @param {number} angle
   */
  static setLineAngle(line, angle) {
    line.style.transform = `rotate(${-360 * angle}deg)`;
    line.classList.toggle("faded", angle === OFF);
  }

  /** @param {SVGElement} svg */
  constructor(svg) {
    const handEls = svg.querySelectorAll(".hand");
    if (handEls.length !== 2) {
      throw Error("A clock should have 2 hands.");
    }
    /** @type {SVGElement} */
    this.svg = svg;
    /** @type {SVGLineElement} */
    this.line1 = handEls[0];
    /** @type {SVGLineElement} */
    this.line2 = handEls[1];
  }

  setAngle(a1, a2) {
    Clock.setLineAngle(this.line1, a1);
    Clock.setLineAngle(this.line2, a2);
  }

  /** @param {boolean} value */
  toggle(value) {
    this.svg.style.display = value ? "" : "none";
  }
}

/**
 * @param {number} width
 * @param {number} height
 * @return {Array<Clock>}
 */
function initClocks(width, height) {
  /** @type {HTMLTemplateElement} */
  const template = document.querySelector("#clock-template");
  /** @type {HTMLDivElement} */
  const container = document.querySelector("#clock-container");
  /** @type {Clock[]} */
  const clocks = [];

  for (let y = 0; y < height; y++) {
    const row = document.createElement("div");
    row.className = "row";
    for (let x = 0; x < width; x++) {
      const instance = template.content.cloneNode(true);
      const svgEl = instance.querySelector("svg");
      svgEl.setAttribute("id", `c-${x}-${y}`);
      clocks.push(new Clock(svgEl));
      row.appendChild(instance);
    }
    container.appendChild(row);
  }

  console.log(`initialized ${clocks.length} clocks`);
  return clocks;
}

/**
 * @param {number} index
 * @param {number} width
 * @return {number}
 */
function mapIndex(index, width) {
  const ii = (index / 2) | 0;
  const digit = (ii / 6) | 0;
  const digitX = ii % 2;
  const digitY = ((ii / 2) | 0) % 3;
  const x = digit * 2 + digitX;
  const y = digitY;
  const j = index % 2;
  return y * width + x + j;
}

/**
 * @param {Clock[]} clocks
 * @param {number[]} pattern
 */
function setPattern(clocks, pattern) {
  requestAnimationFrame(() => {
    for (let i = 0; i < pattern.length; i += 2) {
      clocks[mapIndex(i, 12)].setAngle(pattern[i], pattern[i + 1]);
    }
  });
}

/** @type {number[]} */
const ps = (function () {
  const p0 = [
    0/1, 3/4, 1/2, 3/4,
    1/4, 3/4, 1/4, 3/4,
    0/1, 1/4, 1/4, 1/2,
  ];
  const p1 =[
    OFF, OFF, 5/8, 3/4,
    OFF, OFF, 1/4, 3/4,
    OFF, OFF, 1/4, 1/4,
  ];
  const p2 = [
    0/1, 0/1, 1/2, 3/4,
    0/1, 3/4, 1/4, 1/2,
    0/1, 1/4, 1/2, 1/2,
  ];
  const p3 = [
    0/1, 0/1, 1/2, 3/4,
    0/1, 0/1, 1/4, 1/2,
    0/1, 0/1, 1/4, 1/2,
  ];
  const p4 = [
    3/4, 3/4, 3/4, 3/4,
    0/1, 1/4, 1/4, 3/4,
    OFF, OFF, 1/4, 1/4,
  ];
  const p5 = [
    0/1, 3/4, 1/2, 1/2,
    0/1, 1/4, 1/2, 3/4,
    0/1, 0/1, 1/4, 1/2,
  ];
  const p6 = [
    0/1, 3/4, 1/2, 1/2,
    1/4, 3/4, 1/2, 3/4,
    0/1, 1/4, 1/4, 1/2,
  ];
  const p7 = [
    0/1, 0/1, 1/2, 3/4,
    OFF, OFF, 1/4, 3/4,
    OFF, OFF, 1/4, 1/4,
  ];
  const p8 = [
    0/1, 3/4, 1/2, 3/4,
    0/1, 3/4, 1/2, 3/4,
    0/1, 1/4, 1/4, 1/2,
  ];
  const p9 = [
    0/1, 3/4, 1/2, 3/4,
    0/1, 1/4, 1/4, 3/4,
    0/1, 0/1, 1/4, 1/2,
  ];

  return [p0, p1, p2, p3, p4, p5, p6, p7, p8, p9];
})();

/** @return {number} */
function durationUntilNextMinute() {
  const afterUpdate = new Date();
  const nextMinute = new Date(
    afterUpdate.getFullYear(),
    afterUpdate.getMonth(),
    afterUpdate.getDate(),
    afterUpdate.getHours(),
    afterUpdate.getMinutes() + 1
  );
  return nextMinute.getTime() - afterUpdate.getTime();
}

/**
 * @param {Date} now
 * @return {number}
 */
function durationUntilNextSecond(now) {
  const nextSecond = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds() + 1
  );
  return nextSecond.getTime() - now.getTime();
}

/**
 * @param {Date} now
 * @return {number[]}
 */
function getTimePattern(now) {
  const time =
    `${now.getHours()}`.padStart(2, "0") +
    `${now.getMinutes()}`.padStart(2, "0") +
    `${now.getSeconds()}`.padStart(2, "0");
  return time.split("").flatMap((i) => ps[i]);
}

/** @param {Date} now */
function setTitle(now) {
  document.title =
    `${now.getHours()}`.padStart(2, "0") +
    ":" +
    `${now.getMinutes()}`.padStart(2, "0") +
    ":" +
    `${now.getSeconds()}`.padStart(2, "0");
}

/** @param {Clock[]} clocks */
function tick(clocks) {
  const now = new Date();
  setPattern(clocks, getTimePattern(now));
  setTitle(now);
  setTimeout(tick, durationUntilNextSecond(now), clocks);
}

const clocks = initClocks(12, 3);
let seconds = true;
tick(clocks);

function toggleSeconds() {
  seconds = !seconds;
  document.body.classList.toggle("seconds", seconds);
  for (let i = 8; i < 12; i++) {
    clocks[i].toggle(seconds);
    clocks[i + 12].toggle(seconds);
    clocks[i + 24].toggle(seconds);
  }
}

document
  .querySelector("#clock-container")
  .addEventListener("click", toggleSeconds);

toggleSeconds();
