(function() {

function squareSignal(ev) {
	var inp = ev.inputBuffer.getChannelData(0);
	var out = ev.outputBuffer.getChannelData(0);
	for (var i = 0, n = inp.length; i < n; ++i) {
		out[i] = inp[i]*inp[i];
	}
}

function sqrtSignal(ev) {
	var inp = ev.inputBuffer.getChannelData(0);
	var out = ev.outputBuffer.getChannelData(0);
	for (var i = 0, n = inp.length; i < n; ++i) {
		out[i] = inp[i] > 0 ? 8 * Math.sqrt(inp[i]) : 0; // sqrt + little boost
	}
}

// function maxSignal(ev) {
	// var inp = ev.inputBuffer.getChannelData(0);
	// var out = ev.outputBuffer.getChannelData(0);
	// var n = inp.length;
	// var max = Math.abs(Math.max.apply(null, inp));
	// for (var i = 0; i < n; i++) {
		// out[i] = max;
	// }
// }


function vocoderBandMeter(context, f0, bandwidth) {
	var sys = {};

	sys.sqrt = context.createScriptProcessor(512, 1, 1); // sqrt node
	sys.lowpass = context.createBiquadFilter();
	sys.square = context.createScriptProcessor(256, 1, 1);
	sys.bandpass2 = context.createBiquadFilter();
	sys.bandpass1 = context.createBiquadFilter();

	sys.output = sys.sqrt;
	sys.input = sys.bandpass1;

	sys.sqrt.onaudioprocess = sqrtSignal;

	sys.lowpass.type = "lowpass";
	sys.lowpass.frequency.value = 50;
	sys.lowpass.connect(sys.sqrt);

	sys.square.onaudioprocess = squareSignal;
	sys.square.connect(sys.lowpass);

	sys.bandpass2.type = "bandpass";
	sys.bandpass2.frequency.value = f0;
	sys.bandpass2.Q.value = f0 / bandwidth;
	sys.bandpass2.connect(sys.square);

	sys.bandpass1.type = "bandpass";
	sys.bandpass1.frequency.value = f0;
	sys.bandpass1.Q.value = f0 / bandwidth;
	sys.bandpass1.connect(sys.bandpass2);

	return sys;
}

window.vocoderBandMeter = vocoderBandMeter;

})();
