const bufferLength = 2000;
const freqBuffer = new Float32Array(bufferLength);
const ampBuffer = new Float32Array(bufferLength);
const timeBuffer = new Float32Array(bufferLength);
const frameBufferSize = 1024;
const ampThreshold = 0.02;
/** @type {AudioContext} */
let audioContext;
/** @type {Note[]} */
let noteData;
let lastIndex = 0;
let doProcess = false;

/** @type {Array<() => void>} */
const listeners = [];

async function initWebAudio() {
  const context = new AudioContext();
  audioContext = context;
  const stream = await navigator.mediaDevices.getUserMedia({audio: true, video: false});
  const mic = context.createMediaStreamSource(stream);
  const scriptProcessor = context.createScriptProcessor(frameBufferSize, 1, 1);
  scriptProcessor.onaudioprocess = createAudioProcessListener(context, frameBufferSize);
  mic.connect(scriptProcessor);
  scriptProcessor.connect(context.destination);
  start();
}

export function start() {
  if (doProcess) return;
  if (!audioContext) initWebAudio();
  doProcess = true;
}

export function stop() {
  if (!doProcess) return;
  doProcess = false;
  noteData = createNoteData();
  callListeners();
}

/**
 * @param {AudioContext} context
 * @param {number} bufferSize
 * @return {(e: AudioProcessingEvent) => void}
 */
function createAudioProcessListener(context, bufferSize) {
  let frameIndex = 0;

  return e => {
    if (!doProcess) return;
    if (frameIndex >= bufferLength) return;
    const data = e.inputBuffer.getChannelData(0);

    let crossings = 0;
    let amp = 0;
    let firstXIndex = -1;
    let lastXIndex = -1;
    for (let i = 0; i < data.length - 1; i++) {
      const crossing = data[i] * data[i + 1] < 0
      crossings += Number(crossing);
      amp = Math.max(amp, Math.abs(data[i]));
      if (crossing) lastXIndex = i;
      if (crossings === 1) firstXIndex = i;
    }
    const freq = (crossings - 1) * context.sampleRate / (2 * (lastXIndex - firstXIndex));
    freqBuffer[frameIndex] = freq;
    ampBuffer[frameIndex] = amp;
    timeBuffer[frameIndex] = e.playbackTime;
    lastIndex = frameIndex;
    frameIndex++;
  }
}

/**
 * @param {number} f1 
 * @param {number} f2 
 */
function isSameNote(f1, f2) {
  const minRatio = Math.pow(2, -0.3/12);
  const maxRatio = Math.pow(2, 0.3/12);
  return f1 > f2 * minRatio && f1 < f2 * maxRatio;
}

/**
 * @typedef {Object} Note
 * @property {number} freq
 * @property {number} start
 * @property {number} end
 * @property {number} iStart
 * @property {number} iEnd
 */

function createNoteData() {
  /** @type {Note[]} */
  const events = [];
  const minAmp = ampThreshold;
  /** @type {Note|null} */
  let currentNote = null;
  for (let i = 1; i < lastIndex; i++) {
    const isNoteOn =
      ampBuffer[i-1] >= minAmp && ampBuffer[i] >= minAmp &&
      isSameNote(freqBuffer[i-1], freqBuffer[i]);
    if (isNoteOn) {
      if (currentNote) {
        currentNote.freq = currentNote.freq * 0.95 + freqBuffer[i] * 0.05;
        currentNote.end = timeBuffer[i];
        currentNote.iEnd = i;
      } else {
        currentNote = {
          freq: freqBuffer[i],
          start: timeBuffer[i-1],
          end: timeBuffer[i],
          iStart: i-1,
          iEnd: i,
        };
        events.push(currentNote);
      }
    } else {
      currentNote = null;
    }
  }
  return events.filter(note => note.iEnd - note.iStart >= 2);
}

export function playBackNoteData() {
  if (!noteData || noteData.length === 0) return;

  const osc = audioContext.createOscillator();
  osc.type = 'triangle';
  const gain = audioContext.createGain();
  gain.gain.value = 0;

  const t0 = noteData[0].start;
  const now = audioContext.currentTime;
  const timeDelta = now - t0;
  for (const note of noteData) {
    osc.frequency.setValueAtTime(note.freq, note.start + timeDelta);
    gain.gain.setValueAtTime(1, note.start + timeDelta);
    gain.gain.setValueAtTime(0, note.end + timeDelta);
  }

  osc.connect(gain);
  gain.connect(audioContext.destination);

  osc.start();
}

/**
 * @param {HTMLCanvasElement} canvas 
 */
export function drawNoteDataToCanvas(canvas) {
  const width = lastIndex + 1;
  const height = 150;
  const xScale = 2;
  const yScale = 4;
  canvas.width = xScale * width;
  canvas.height = yScale * height;
  const ctx = canvas.getContext('2d');

  // Plot raw data
  for (let i = 0; i < lastIndex; i++) {
    const noteNumber = 12 * Math.log2(freqBuffer[i] / 55) + 33;
    if (ampBuffer[i] >= ampThreshold) {
      ctx.fillStyle = `rgba(0,200,0,${ampBuffer[i]})`;
    } else {
      ctx.fillStyle = `rgba(0,0,0,${ampBuffer[i]})`;
    }
    ctx.fillRect(xScale * i, yScale * (height - noteNumber), xScale, yScale);
  }

  // Plot interpretation
  ctx.fillStyle = '#00f';
  for (const note of noteData) {
    const noteNumber = 12 * Math.log2(note.freq / 55) + 33;
    ctx.fillRect(xScale * note.iStart, yScale * (height - noteNumber) + yScale/2, xScale * (note.iEnd - note.iStart), 1);
  }
}

/**
 * @param {() => void} listener 
 */
export function addListener(listener) {
  listeners.push(listener);
}

function callListeners() {
  for (const f of listeners) {
    f();
  }
}
