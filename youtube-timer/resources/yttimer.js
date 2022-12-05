//@ts-check

// Utils
/** @param {string} s */
function $(s) {
  return /** @type {HTMLElement} */ (document.querySelector(s));
}
/**
 * @param {string} tag
 * @param {Element|undefined} parent
 * @param {any} attr
 */
function makeEl(tag, parent, attr) {
  var el = document.createElement(tag);
  Object.assign(el, attr);
  if (parent && parent.appendChild) parent.appendChild(el);
  return el;
}

/**
 * User type definition
 * @typedef {Object} TimerOptions
 * @property {number} s
 * @property {number} m
 * @property {number} h
 * @property {(() => void)=} ontimeout
 * @property {boolean=} wait
 */

// Timer Class
class Timer {
  /**
   * @param {HTMLElement} el
   * @param {TimerOptions} op
   */
  constructor(el, op) {
    this.s = op.s || 0;
    this.m = op.m || 0;
    this.h = op.h || 0;
    this.paused = true;
    this.ontimeout = op.ontimeout || function () {
      alert("Time Up!");
    };
    this.container = el;
    this.update(true);
    if (!op.wait) this.start();
  }

  update(skipTimeUpdate = false) {
    // Change numbers
    if (!skipTimeUpdate) {
      if (this.s > 0) {
        this.s--;
      } else if (this.m > 0) {
        this.m--;
        this.s = 59;
      } else if (this.h > 0) {
        this.h--;
        this.m = 59;
        this.s = 59;
      } else {
        clearInterval(this.updateInterval);
      }
    }
    // Update HTML
    this.container.innerHTML = [
      this.h.toString().padStart(2, "0"),
      this.m.toString().padStart(2, "0"),
      this.s.toString().padStart(2, "0"),
    ].join(":");
  }

  start() {
    if (!this.paused) return;
    if (this.container) {
      this.updateInterval = setInterval(() => {
        this.update();
      }, 1000);
      this.update(true);
    }
    this.timeout = setTimeout(
      this.ontimeout,
      1000 * this.s + 60000 * this.m + 3600000 * this.h,
    );
    this.paused = false;
  }

  pause() {
    if (this.paused) {
      return;
    }
    clearInterval(this.updateInterval);
    clearTimeout(this.timeout);
    this.paused = true;
  }

  clear() {
    this.pause();
    if (this.container) this.container.innerHTML = "00:00:00";
  }
}

// Globals
var timer = null;
var ytPlayer;
/**
 * @typedef {Object} Options
 * @property {string} t
 * @property {string} v
 * @property {boolean} auto
 * @property {boolean} loop
 * @property {string} size
 * @property {string} at
 * @property {number} vol
 */
/** @type {Options} */
var options = {
  t: "0",
  v: "M7lc1UVf-VE",
  auto: false,
  loop: false,
  size: "",
  at: "00:00",
  vol: 100,
};

// App-specific Utils
/** @param {string} tStr */
function formatTimeMinimal(tStr) {
  if (!/^(\d{1,2}:){0,2}\d{1,2}$/.test(tStr)) return "00";

  var t = tStr.split(":");
  for (var i = 0; i < t.length; i++) {
    t[i] = t[i].padStart(2, "0");
  }
  while (t[0] === "00") t.shift();
  return t.join(":");
}
/** @param {string} tStr */
function formatTimeFull(tStr) {
  if (!/^(\d{1,2}:){0,2}\d{1,2}$/.test(tStr)) return "00:00:00";

  var t = tStr.split(":");
  for (var i = 0; i < t.length; i++) {
    t[i] = t[i].padStart(2, "0");
  }
  while (t.length < 3) t.unshift("00");
  return t.join(":");
}
/** @param {string=} tStr */
function validateTimeSeconds(tStr) {
  if (!tStr) return 0;
  if (!/^(\d{1,2}:){0,2}\d{1,2}$/.test(tStr)) return 0;

  var s = 0;
  var t = tStr.split(":");
  for (var i = t.length; i-- > 0;) {
    s += parseInt(t[i], 10) * Math.pow(60, t.length - i - 1);
  }
  return s;
}
function setTime() {
  var el = $("#timer");
  if (!el) return;
  var put = makeEl("input", undefined, {
    value: el.innerHTML,
    onblur() {
      var t = formatTimeMinimal(this.value);
      if (t) options.t = t;
      this.parentNode.innerHTML = formatTimeFull(options.t);
    },
  });
  el.innerHTML = "";
  el.appendChild(put);
  put.focus();
}
/** @param {string|null|undefined} idOrUrl */
function loadVideo(idOrUrl) {
  if (!idOrUrl) return;
  var vid = idOrUrl.replace(/^[^v]+v.(.{11}).*/, "$1");
  if (vid.length === 11) {
    options.v = vid;
    ytPlayer.cueVideoById(vid);
  }
}
function resetVideo() {
  if (options.v) ytPlayer.cueVideoById(options.v);
}
/**
 * @param {number} w
 * @param {number} h
 */
function ytResize(w, h) {
  ytPlayer.setSize(w, h);
  options.size = [w, h].join(",");
}
function closeParent() {
  this.parentNode.remove();
  return false;
}
/**
 * @param {Element} e
 * @param {Object=} op
 * @returns {HTMLElement}
 */
function addCloseButton(e, op) {
  var df = {
    innerHTML: "x",
    className: "close-button",
    href: "#",
    onclick: closeParent,
  };
  return makeEl("a", e, Object.assign(df, op));
}
/**
 * @param {Element} p
 * @param {Object=} op
 * @returns {Element}
 */
function makeBox(p, op) {
  var e = makeEl("div", p, Object.assign({ className: "ctr box" }, op));
  addCloseButton(e);
  return e;
}
function displayLink() {
  var e = /** @type {HTMLInputElement?} */ ($("#link-box"));
  if (!e) {
    var c = makeBox($("#more"));
    e =
      /** @type {HTMLInputElement} */ (makeEl("input", c, {
        type: "text",
        id: "link-box",
      }));
  }
  e.value = setOptions.getLink();
  e.select();
}
function displayQR() {
  var e =
    /** @type {HTMLImageElement} */ ($("#qrc") ||
      makeEl("img", makeBox($("#more")), { id: "qrc" }));
  var link = encodeURIComponent(setOptions.getLink());
  e.src = `http://chart.apis.google.com/chart?cht=qr&chs=300x300&chl=${link}`;
}
function ytStateChange() {
  var state = ytPlayer.getPlayerState();
  if (state === 0 && options.loop) ytPlayer.seekTo(0);
}

// Application
function startTimer() {
  if (!options.v) {
    alert("Load a video first.");
    return;
  }
  var timeStr = $("#timer").innerHTML.split(":");
  /** @type {TimerOptions} */
  var timerOpt = {
    s: parseInt(timeStr[timeStr.length - 1], 10),
    m: parseInt(timeStr[timeStr.length - 2], 10),
    h: parseInt(timeStr[timeStr.length - 3], 10),
    ontimeout() {
      ytPlayer.seekTo(validateTimeSeconds(options.at), true);
      $("#set-time").onclick = setTime;
      $("#start").innerHTML = "Start";
      $("#start").onclick = startTimer;
    },
  };
  // validate time
  if (!timerOpt.s) {
    if (!timerOpt.m && !timerOpt.h) {
      ytPlayer.seekTo(validateTimeSeconds(options.at), true);
      return;
    }
    timerOpt.s = 0;
  }
  if (!timerOpt.m) timerOpt.m = 0;
  if (!timerOpt.h) timerOpt.h = 0;
  timer = new Timer($("#timer"), timerOpt);
  $("#set-time").onclick = null;
  $("#start").onclick = function () {
    timer.pause();
    $("#set-time").onclick = setTime;
    $("#start").innerHTML = "Start";
    $("#start").onclick = startTimer;
  };
  $("#start").innerHTML = "Pause";
}

// Option Methods
var setOptions = {
  main() {
    var optString = location.hash;
    ytPlayer.addEventListener("onStateChange", "ytStateChange");
    if (!optString) return;

    var autoStart = false;
    var opts = optString.slice(1).split("&");

    for (var i = 0; i < opts.length; i++) {
      if (opts[i] === "auto=1") autoStart = true;
      var [name, value] = opts[i].split("=");
      setOptions[name](value);
    }
    if (autoStart) startTimer();
  },
  getLink() {
    var url = location.href.split("#")[0], opts = [], i;
    for (i in options) {
      opts.push(i + "=" + options[i]);
    }
    url = [url, opts.join("&")].join("#");
    return url;
  },
  /** @param {string} v */
  v(v) {
    options.v = v;
    ytPlayer.cueVideoById(options.v);
  },
  t(t) {
    t = formatTimeMinimal(t);
    if (!t) return;
    options.t = t;
    $("#timer").innerHTML = formatTimeFull(t);
  },
  loop(x) {
    if (x === "1") {
      options.loop = true;
      var loopCheckbox = /** @type {HTMLInputElement} */ ($("#loop"));
      loopCheckbox.checked = true;
    }
  },
  auto(x) {
    if (x === "1") options.auto = true;
  },
  size(s) {
    s = s.split(",");
    if (s.length !== 2) return;
    s[0] = parseInt(s[0], 10);
    s[1] = parseInt(s[1], 10);
    if (s[0] > 0 && s[1] > 0) {
      options.size = s.join(",");
      ytResize(s[0], s[1]);
    }
  },
  vol(v) {
    ytPlayer.setVolume(parseInt(v, 10));
    v = ytPlayer.getVolume();
    options.vol = v;
    var volumeElement = /** @type {HTMLInputElement} */ ($("#vol"));
    volumeElement.value = v;
  },
  at(t) {
    if (validateTimeSeconds(t) < 1) {
      options.at = "00:00";
      return;
    }
    t = formatTimeMinimal(t);
    options.at = t;
    var atElement = /** @type {HTMLInputElement} */ ($("#at"));
    atElement.value = formatTimeMinimal(t);
  },
  checkBox() {
    if (this.checked) options[this.id] = true;
    else delete options[this.id];
  },
};

var onPlayerReady = setOptions.main;

// Space = pause
window.onkeypress = function (e) {
  if (!e) return;
  if (e.keyCode === 32 || e.charCode === 32) {
    var s = ytPlayer.getPlayerState();
    if (s === 1) ytPlayer.pauseVideo();
    else if (s === 2) ytPlayer.playVideo();
  }
};

function onYouTubeIframeAPIReady() {
  //@ts-ignore
  ytPlayer = new YT.Player(document.querySelector("#yt-player"), {
    height: "390",
    width: "640",
    videoId: options.v,
    playerVars: { "playsinline": 1 },
    events: {
      "onReady": onPlayerReady,
    },
  });
}

window.onload = function () {
  $("#yt-load").onclick = function (e) {
    loadVideo(prompt("Enter the desired YouTube video URL or ID."));
  };
  $("#set-time").onclick = setTime;
  $("#start").onclick = startTimer;
  $("#vol").onblur = function (e) {
    setOptions.vol(/** @type {HTMLInputElement} */ (e.target).value);
  };
  $("#at").onblur = function (e) {
    setOptions.at(/** @type {HTMLInputElement} */ (e.target).value);
  };
  $("#loop").onclick = setOptions.checkBox;
  $("#yt-reset").onclick = resetVideo;
  $("#get-link").onclick = displayLink;
  $("#get-qr").onclick = displayQR;
};
