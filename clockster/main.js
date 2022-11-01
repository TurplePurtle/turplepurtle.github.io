// @ts-check

const OFF = 9 / 16;

/**
 * @template T
 * @param {any} value
 * @param {{new(): T}} type
 * @returns {T}
 */
function assertType(value, type) {
  if (value instanceof type) return value;
  throw TypeError();
}

class Clock {
  /**
   * @param {SVGLineElement} line
   * @param {number} angle
   * @param {boolean=} maybeFade
   */
  static setLineAngle(line, angle, maybeFade = true) {
    line.style.transform = `rotate(${-360 * angle}deg)`;
    if (maybeFade) line.classList.toggle("faded", angle === OFF);
  }

  /** @param {SVGElement} svg */
  constructor(svg) {
    const handEls = svg.querySelectorAll(".hand");
    const shadows = svg.querySelectorAll(".hand-shadow");
    if (handEls.length !== 2) {
      throw Error("A clock should have 2 hands.");
    }
    /** @type {SVGElement} */
    this.svg = svg;
    /** @type {SVGLineElement} */
    this.line1 = assertType(handEls[0], SVGLineElement);
    /** @type {SVGLineElement} */
    this.line2 = assertType(handEls[1], SVGLineElement);
    /** @type {SVGLineElement} */
    this.shadow1 = assertType(shadows[0], SVGLineElement);
    /** @type {SVGLineElement} */
    this.shadow2 = assertType(shadows[1], SVGLineElement);
  }

  /**
   * @param {number} a1
   * @param {number} a2
   */
  setAngle(a1, a2) {
    Clock.setLineAngle(this.line1, a1);
    Clock.setLineAngle(this.line2, a2);
    Clock.setLineAngle(this.shadow1, a1, false);
    Clock.setLineAngle(this.shadow2, a2, false);
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
  const template = assertType(
    document.querySelector("#clock-template"),
    HTMLTemplateElement
  );
  const container = assertType(
    document.querySelector("#clock-container"),
    HTMLElement
  );
  /** @type {Clock[]} */
  const clocks = [];

  for (let y = 0; y < height; y++) {
    const row = document.createElement("div");
    row.className = "row";
    for (let x = 0; x < width; x++) {
      const instance = assertType(
        template.content.cloneNode(true),
        DocumentFragment
      );
      const svgEl = assertType(instance.querySelector("svg"), SVGSVGElement);
      svgEl.setAttribute("id", `c-${x}-${y}`);
      clocks.push(new Clock(svgEl));
      row.appendChild(instance);
    }
    container.appendChild(row);
  }

  for (let i = 8; i < 12; i++) {
    clocks[i].svg.classList.add("is-seconds");
    clocks[i + 12].svg.classList.add("is-seconds");
    clocks[i + 24].svg.classList.add("is-seconds");
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

// prettier-ignore
/** @type {number[][]} */
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
tick(clocks);

const settings = ["light", "seconds", "no-shadows"];
const activeSettings = !location.hash.length
  ? []
  : location.hash.slice(1).split(",");

function checkSettings() {
  document.body.className = activeSettings.join(" ");
}

/**
 * @param {string} name
 * @param {boolean=} value
 */
function toggleSetting(name, value) {
  const index = activeSettings.indexOf(name);
  const found = index >= 0;
  const changed = found ? value !== true : value !== false;
  if (!changed) return;

  // Update URL
  if (found) {
    activeSettings.splice(index, 1);
  } else {
    activeSettings.push(name);
  }
  location.hash = activeSettings.join(",");

  // Update body class
  document.body.className = activeSettings.join(" ");
}

window.addEventListener("hashchange", checkSettings);
checkSettings();

(function initSettingsContainer() {
  /** @type {HTMLElement} */
  const settingsContainer = assertType(
    document.querySelector("#settings"),
    HTMLElement
  );

  for (const name of settings) {
    const label = document.createElement("label");
    label.className = "setting";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = activeSettings.indexOf(name) >= 0;
    checkbox.addEventListener("change", () =>
      toggleSetting(name, checkbox.checked)
    );
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(name));
    settingsContainer.appendChild(label);
  }

  let settingsTimeout = 0;
  function hideSettings() {
    settingsContainer.classList.add("hidden");
  }
  function showSettingsOnMouseMove() {
    clearTimeout(settingsTimeout);
    settingsContainer.classList.remove("hidden");
    settingsTimeout = setTimeout(hideSettings, 3000);
  }
  document.body.addEventListener("click", showSettingsOnMouseMove);
  document.body.addEventListener("mousemove", showSettingsOnMouseMove);
})();
