
var editorNode = document.querySelector(".music-editor-container");
var editor = new Musicker.Editor(editorNode);
editorNode.scrollTop = (editor.height - editorNode.offsetHeight) / 2;

var audioContext = new AudioContext();
var synth = new Musicker.Synth(audioContext);
synth.output.connect(audioContext.destination);

var playButton = document.querySelector("#play-button");
var stopButton = document.querySelector("#stop-button");
var bpmInput = document.querySelector("#bpm-input");

var playing = false;

function play() {
  playing = true;
  synth.schedule(editor.noteList, +bpmInput.value);
}
function stop() {
  playing = false;
  synth.halt();
}

playButton.onclick = play;
stopButton.onclick = stop;

// Play/Stop with space bar
var spaceDown = false;
window.addEventListener("keydown", function(e) {
  if (e.keyCode === 32) {
    e.preventDefault();

    if (!spaceDown) {
      spaceDown = true;
      if (playing) stop(); else play();
    }
  }
}, true);
window.addEventListener("keyup", function(e) {
  if (e.keyCode === 32) {
    spaceDown = false;
  }
}, true);
