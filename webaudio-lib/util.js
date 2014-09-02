/// Silly polyfilling
window.AudioContext = window.AudioContext || window.webkitAudioContext;
navigator.getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;

/// Util functions
// query selector helper
function $(s,a,p) {
	if (typeof s !== "string") return s;
	p = p || document;
	return a ? p.querySelectorAll(s) : p.querySelector(s);
}

function readFileToAudioBuffer(file, context, onload) {
	var reader = new FileReader();
	reader.onload = function(ev) {
		context.decodeAudioData(ev.target.result, onload);
	};
	reader.readAsArrayBuffer(file);
}
