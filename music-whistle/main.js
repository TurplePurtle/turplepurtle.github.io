import {addListener, drawNoteDataToCanvas, playBackNoteData, start, stop} from "./webaudio.js";

const recordButton = document.querySelector('#record-button');
const stopButton = document.querySelector('#stop-button');
const playbackButton = document.querySelector('#playback-button');
const canvas = document.querySelector('#canvas');

recordButton.addEventListener('click', () => {
  start();
  recordButton.setAttribute('disabled', '');
  stopButton.removeAttribute('disabled');
});
stopButton.addEventListener('click', () => {
  stop();
  stopButton.setAttribute('disabled', '');
  drawNoteDataToCanvas(canvas);
});
playbackButton.addEventListener('click', playBackNoteData);
addListener(() => {
  playbackButton.removeAttribute('disabled');
});
