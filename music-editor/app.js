
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


// Recorder
var microphone = null;
var recording = false;
var recorder = null;
var loadMicrophoneButton = document.querySelector("#load-microphone-button");
var recordButton = document.querySelector("#record-button");

function loadMicrophone() {
    if (microphone) return;

    navigator.getUserMedia({audio: true, video: false}, function(stream) {
        microphone = audioContext.createMediaStreamSource(stream);
        recorder = new Musicker.Recorder(microphone, {
            workerPath: "Recorderjs/recorderWorker.js",
        })
        loadMicrophoneButton.remove();
    }, function(err) { throw new Error(err.name) });
}
loadMicrophoneButton.onclick = loadMicrophone;

function recordMicrophone() {
    if (!microphone) throw new Error("Microphone not connected.");

    if (!recording) {
        recording = true;
        this.textContent = "Stop Recording";
        recorder.record();
    } else {
        recording = false;
        this.textContent = "Record";

        recorder.stop();
        recorder.getBufferSource(function(bufferSource) {
            bufferSource.connect(bufferSource.context.destination);
            bufferSource.start(0);
        });
    }

}
recordButton.onclick = recordMicrophone;
