class Clock {
  /**
   * @param {SVGLineElement} line
   * @param {number} angle
   */
  static setLineAngle(line, angle) {
    line.style.transform = `rotate(${-360 * angle}deg)`;
  }

  constructor(line1, line2) {
    /** @type {SVGLineElement} */
    this.line1 = line1;
    /** @type {SVGLineElement} */
    this.line2 = line2;
  }

  setAngle(a1, a2) {
    Clock.setLineAngle(this.line1, a1);
    Clock.setLineAngle(this.line2, a2);
  }
}

/** @return {Array<Clock>} */
function initClocks() {
  /** @type {HTMLTemplateElement} */
  const template = document.querySelector("#clock-template");
  /** @type {HTMLDivElement} */
  const container = document.querySelector("#clock-container");
  /** @type {Clock[]} */
  const clocks = [];

  for (let y = 0; y < 3; y++) {
    const row = document.createElement("div");
    row.className = "row";
    for (let x = 0; x < 8; x++) {
      const instance = template.content.cloneNode(true);
      const svgEl = instance.querySelector("svg");
      svgEl.setAttribute("id", `c-${x}-${y}`);
      const lineEls = instance.querySelectorAll("line");
      lineEls[0].setAttribute("class", "l-0");
      lineEls[1].setAttribute("class", "l-1");
      clocks.push(new Clock(lineEls[0], lineEls[1]));
      row.appendChild(instance);
    }
    container.appendChild(row);
  }

  return clocks;
}

/**
 * @param {number} index
 * @return {number}
 */
function mapIndex(index) {
  const ii = (index / 2) | 0;
  const digit = (ii / 6) | 0;
  const digitX = ii % 2;
  const digitY = ((ii / 2) | 0) % 3;
  const x = digit * 2 + digitX;
  const y = digitY;
  const j = index % 2;
  return y * 8 + x + j;
}

/**
 * @param {Clock[]} clocks
 * @param {number[]} pattern
 */
function setPattern(clocks, pattern) {
  requestAnimationFrame(() => {
    for (let i = 0; i < pattern.length; i += 2) {
      clocks[mapIndex(i)].setAngle(pattern[i], pattern[i + 1]);
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
    5/8, 5/8, 5/8, 3/4,
    5/8, 5/8, 1/4, 3/4,
    5/8, 5/8, 1/4, 1/4,
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
    5/8, 5/8, 1/4, 1/4,
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
    5/8, 5/8, 1/4, 3/4,
    5/8, 5/8, 1/4, 1/4,
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

/** @return {number[]} */
function getTimePattern() {
  const now = new Date();
  const time = `${now.getHours()}`.padStart(2, "0") +
    `${now.getMinutes()}`.padStart(2, "0");
  return time.split("").flatMap((i) => ps[i]);
}

/** @param {Clock[]} clocks */
function tick(clocks) {
  setPattern(clocks, getTimePattern());
  setTimeout(tick, durationUntilNextMinute(), clocks);
}

tick(initClocks());
