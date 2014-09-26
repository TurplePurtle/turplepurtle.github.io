
var editorNode = document.querySelector(".music-editor-container");
var editor = new Musicker.Editor(editorNode);
editorNode.scrollTop = (editor.height - editorNode.offsetHeight) / 2;

var audioContext = new AudioContext();
var synth = new Musicker.Synth(audioContext);
synth.output.connect(audioContext.destination);

var playButton = document.querySelector("#play-button");
var stopButton = document.querySelector("#stop-button");

playButton.onclick = function() {
  synth.schedule(editor.noteList, editor.bpm);
};

stopButton.onclick = function() {
  synth.halt();
};

// Play/Stop with space bar
var spaceDown = false, playing = false;
window.addEventListener("keydown", function(e) {
  if (e.keyCode === 32) {
    e.preventDefault();
    if (!spaceDown) {
      spaceDown = true;
      if (playing) {
        synth.halt();
        playing = false;
      } else {
        playing = true;
        synth.schedule(editor.noteList, editor.bpm);
      }
    }
  }
}, true);
window.addEventListener("keyup", function(e) {
  if (e.keyCode === 32) {
    spaceDown = false;
  }
}, true);
