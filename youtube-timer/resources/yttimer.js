// Utils
function $(e) {
  if (e.charAt(0) === "#") {
    return document.getElementById(e.substr(1));
  } else if (e.charAt(0) === ".") {
    return document.getElementsByClassName(e.substr(1));
  } else {
    return document.getElementsByTagName(e);
  }
}
function copyProps(a, b, m) {
  if (typeof a !== "object") return b;
  if (typeof m !== "object") m = {};
  for (var i in a) {
    b[m.hasOwnProperty(i) ? m[i] : i] = a[i];
  }
  return b;
}
function makeEl(e, p, a) {
  e = document.createElement(e);
  e = copyProps(a, e, {text: "innerHTML", "class": "className"});
  if (p && p.appendChild) p.appendChild(e);
  return e;
}
function closeParent() {
  var el  = this.parentNode;
  el.parentNode.removeChild(el);
  return false;
}
function hasLen(s, L) {
  return s.length >= L ? s : hasLen("0" + s, L);
}

// Timer Class
function Timer(op, el) {
  this.s = op.s || op.sec || 0;
  this.m = op.m || op.min || 0;
  this.h = op.h || op.hrs || 0;
  this.paused = true;
  this.ontimeout = op.f || op.ontimeout || function() { alert("Time Up!"); };
  if (el) {
    this.container = el;
    this.update(true);
  }
  if (!op.wait) this.start();
}

Timer.prototype.update = function(skipTimeUpdate) {
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
    hasLen(this.h.toString(), 2),
    hasLen(this.m.toString(), 2),
    hasLen(this.s.toString(), 2)].join(":");
};

Timer.prototype.start = function() {
  var self = this;
  if (!self.paused) return;
  if (self.container) {
    self.updateInterval = setInterval(function(){self.update();}, 1000);
    self.update(true);
  }
  self.timeout = setTimeout(self.ontimeout, 1000 * self.s + 60000 * self.m + 3600000 * self.h);
  self.paused = false;
};

Timer.prototype.pause = function() {
  if (this.paused) return;
  clearInterval(this.updateInterval);
  clearTimeout(this.timeout);
  this.paused = true;
};

Timer.prototype.clear = function() {
  this.pause();
  if (this.container) this.container.innerHTML = "00:00:00";
};

// Globals
var timer = null, ytPlayer, options = {t: "0"}, setOptions = {}, jp = {};

// App-specific Utils
jp.load = function(o) {
  var s = $("#_jp"), c = $("#search-r");
  if (!c) return;
  var i, j, v, mg;
  c.innerHTML = "";
  jp.r = o;

  if (o.feed.entry) {
    for (var i=0, j=o.feed.entry.length; i < j; i++) {
      v = o.feed.entry[i];
      mg = v.media$group;
      makeEl("div", c, {"class": "vid", text: [
        '<a onclick="loadVideo(this.href);return false;" href="', mg.media$content[0].url,
        '"><img class="thumb" src="', mg.media$thumbnail[1].url, '"></a>',
        '<h3>', mg.media$title.$t, '</h3>',
        '<span class="i">by ', v.author[0].name.$t, '</span>',
        '<p>', mg.media$description.$t.length < 180 ? mg.media$description.$t : mg.media$description.$t.substr(0, 180) + "...", '</p>'
      ].join("")});
    }
  } else {
    makeEl("p", c, {text: "No results found."});
  }
  s.parentNode.removeChild(s);
};

jp.ytSearch = function(q, i, t) {
  if (!q || typeof q !== "string") return;
  var ps = $("#_jp"), s, ss;

  if (ps) {
    if (!t) { t = 0; }
    if (t < 2) { setTimeout(jp.ytSearch, 1000, q, i, t + 1); return; }
    else { ps.parentNode.removeChild(ps); }
  }
  jp._q = q;
  ss = [
    "http://gdata.youtube.com/feeds/api/videos?alt=json-in-script",
    "callback=jp.load",
    "max-results=10",
    "q=" + encodeURIComponent(q).replace(/%20/g, "+"),
  ];
  if (i > 1) ss.push("start-index=" + i);
  else i = 1;
  jp._i = i;
  s = makeEl("script", $("head")[0], {id: "_jp", src: ss.join("&")});
};

function validateTime(t, L) {
  if (!/^(\d{1,2}:){0,2}\d{1,2}$/.test(t)) return false;

  var i, s = 0;
  t = t.split(":");
  for (i = t.length; i--; ) {
    s += parseInt(t[i], 10) * Math.pow(60, t.length - i - 1);
    while(t[i].length < 2) { t[i] = "0" + t[i]; }
  }
  if (!L) {
    while (t[0] === "00") t.shift();
  } else if (L === 1) {
    while (t.length < 3) { t.unshift("00"); }
  } else if (L === 2) {
    return s;
  }
  return t.join(":");
}
function setTime() {
  var el = $("#timer"), put;
  put = makeEl("input", null, {value: el.innerHTML, onblur: function() {
    var t = validateTime(this.value);
    if (t) { options.t = t; }
    this.parentNode.innerHTML = validateTime(options.t, 1);
  }});
  el.innerHTML = "";
  el.appendChild(put);
  put.focus();
}
function loadVideo(v) {
  if (!v || typeof v !== "string") v = prompt("Enter the desired YouTube video URL or ID.");
  if (!v) return;
  v = v.replace(/^[^v]+v.(.{11}).*/, "$1");
  if (v.length === 11) {
    options.v = v;
    ytPlayer.cueVideoById(v);
  }
}
function resetVideo() {
  if (options.v) ytPlayer.cueVideoById(options.v);
}
function ytResize(w, h) {
  var e;
  if (e = $("#yt-container").getElementsByTagName("object")[0]) {
    if (w) { e.width = w; }
    if (h) { e.height = h; }
  }
  if (e = $("#yt-container").getElementsByTagName("embed")[0]) {
    if (w) { e.width = w; }
    if (h) { e.height = h; }
  }
  ytPlayer.setSize(w, h);
  options.size = [w, h].join(",");
}
function addCloseButton(e, op) {
  var df = {text: "x", "class": "close-button", href: "#", onclick: closeParent};
  return makeEl("a", e, copyProps(op, df));
}
function makeBox(p, op) {
  var e = makeEl("div", p, copyProps(op, {"class": "ctr box"}));
  addCloseButton(e);
  return e;
}
function displayLink() {
  var c, e = $("#link-box");
  if (!e) {
    c = makeBox($("#more"));
    e = makeEl("input", c, { type: "text", id: "link-box" });
  }
  e.value = setOptions.getLink();
  e.select();
}
function displayQR() {
  var e = $("#qrc") || makeEl("img", makeBox($("#more")), {id: "qrc"});

  e.src = ["http://chart.apis.google.com/chart?cht=qr&chs=300x300&chl=",
    encodeURIComponent(setOptions.getLink())].join("");
}
function displaySearch() {
  if ($("#search-box")) { $("#search-q").focus(); return; }

  var e = makeBox(null, {id: "search-box"}), f, i;
  $("body")[0].insertBefore(e, $("#yt-container"));
  f = document.createElement("form");
  f.onsubmit = function(ev) {
    if (ev && ev.preventDefault) ev.preventDefault();
    jp.ytSearch($("#search-q").value);
    return false;
  };
  i = makeEl("input", f, {id: "search-q", "type": "text"});
  makeEl("input", f, {"type": "submit", value: "Search"});
  makeEl("a", f, {text:"&lt;", href: "#", onclick: function(){
    if (jp._q && jp._i > 10) jp.ytSearch(jp._q, jp._i - 10);
    return false;
  }});
  makeEl("a", f, {text:"&gt;", href: "#", onclick: function(){
    if (jp._q && jp._i) jp.ytSearch(jp._q, jp._i + 10);
    return false;
  }});
  e.appendChild(f);
  makeEl("div", e, {id: "search-r"});
  i.focus();
}
function ytStateChange() {
  var s = ytPlayer.getPlayerState();
  if (s === 0 && options.loop) ytPlayer.seekTo(0);
}

// Application
function startTimer() {
  if (!options.v) { alert("Load a video first."); return; }
  var t = $("#timer").innerHTML.split(":"), tt = {};
  tt.s = parseInt(t[t.length - 1], 10);
  tt.m = parseInt(t[t.length - 2], 10);
  tt.h = parseInt(t[t.length - 3], 10);
  // validate time
  if (!tt.s) {
    if (!tt.m && !tt.h) {
      ytPlayer.seekTo(validateTime(options.at, 2) || 0, true);
      return;
    }
    delete tt.s;
  }
  if (!tt.m) delete tt.m;
  if (!tt.h) delete tt.h;
  tt.f = function() {
    ytPlayer.seekTo(validateTime(options.at, 2) || 0, true);
    $("#set-time").onclick = setTime;
    $("#start").innerHTML = "Start";
    $("#start").onclick = startTimer;
  };
  timer = new Timer(tt, $("#timer"));
  $("#set-time").onclick = null;
  $("#start").onclick = function() {
    timer.pause();
    $("#set-time").onclick = setTime;
    $("#start").innerHTML = "Start";
    $("#start").onclick = startTimer;
  };
  $("#start").innerHTML = "Pause";
}

// Option Methods
setOptions.main = function() {
  var opts = location.hash;
  ytPlayer.addEventListener("onStateChange", "ytStateChange");
  if (!opts) return;

  var i, j, a, o;
  opts = opts.substr(1).split("&");
  j = opts.length;

  for (i = 0; i < j; i++) {
    o = opts[i];
    if (o === "auto=1") { a = true; }
    o = o.split("=");
    setOptions[o[0]](o[1]);
  }
  if (a) startTimer();
};
setOptions.getLink = function() {
  var url = location.href.split("#")[0], opts = [], i;
  for (i in options) {
    opts.push(i + "=" + options[i]);
  }
  url = [url, opts.join("&")].join("#");
  return url;
};
setOptions.v = function(v) {
  options.v = v;
  ytPlayer.cueVideoById(options.v);
};
setOptions.t = function(t) {
  t = validateTime(t);
  if (!t) return;
  options.t = t;
  $("#timer").innerHTML = validateTime(t, 1);
};
setOptions.loop = function(x) {
  if (x === "1") {
    options.loop = x;
    $("#loop").checked = true;
  }
};
setOptions.auto = function(x) {
  if (x === "1") options.auto = x;
};
setOptions.size = function(s) {
  s = s.split(",");
  if (s.length !== 2) return;
  s[0] = parseInt(s[0], 10);
  s[1] = parseInt(s[1], 10);
  if (s[0] > 0 && s[1] > 0) {
    options.size = s.join(",");
    ytResize(s[0], s[1]);
  }
};
setOptions.vol = function(v) {
  ytPlayer.setVolume(parseInt(v, 10));
  v = ytPlayer.getVolume();
  if (v < 100) {
    options.vol = v;
    $("#vol").value = v;
  } else if (options.vol < 100) {
    delete options.vol;
  }
}
setOptions.at = function(t) {
  if (validateTime(t, 2) < 1) {
    if (options.at) delete options.at;
    return;
  }
  t = validateTime(t);
  options.at = t;
  $("#at").value = validateTime(t);
}
setOptions.checkBox = function() {
  if (this.checked) options[this.id] = true;
  else delete options[this.id];
};

var onYouTubePlayerReady = setOptions.main;
// Space = pause
document.onkeypress = function(e){
  if (!e) return;
  if (e.keyCode === 32 || e.charCode === 32) {
    var s = ytPlayer.getPlayerState();
    if (s === 1) { ytPlayer.pauseVideo(); }
    else if (s === 2) { ytPlayer.playVideo(); }
  }
};
window.onload = function() {
  (function() { // Load video using SWFObject
    var src = "http://www.youtube.com/apiplayer?enablejsapi=1&version=3",
      elId = "yt-player",
      width = "560",
      height = "349",
      flashVer = "8",
      params = {allowScriptAccess: "always"},
      att = {id: "ytPlayer"};
    swfobject.embedSWF(src, elId, width, height, flashVer, null, null, params, att);
  })();
  ytPlayer = $("#ytPlayer");
  $("#yt-load").onclick = loadVideo;
  $("#yt-search").onclick = displaySearch;
  $("#set-time").onclick = setTime;
  $("#start").onclick = startTimer;
  $("#vol").onblur = function(){ setOptions.vol(this.value); };
  $("#at").onblur = function(){ setOptions.at(this.value); };
  $("#loop").onclick = setOptions.checkBox;
  $("#yt-reset").onclick = resetVideo;
  $("#get-link").onclick = displayLink;
  $("#get-qr").onclick = displayQR;
};