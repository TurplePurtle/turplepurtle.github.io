
(function() {

	/* Graph:
		synth -> delay -> vocoder -> compressor -> reverb -> output
	*/

	var
	microphone,
	keyboard = qwertyHancock("keyboard", 900, 150, 4, "C4", "white", "black", "#eeeeaa"),
	context = new AudioContext,
	compressor = context.createDynamicsCompressor(),
	// synth = new OscX3(context),
	// reverb = context.createConvolver(),
	delay = context.createDelay(),
	vocoder = new Vocoder(context, 64);


	function makeSynth(freq) {
		var synth = new OscX3(context);
		synth.osc[0].type = synth.osc[0].SAWTOOTH;
		synth.osc[1].type = synth.osc[1].SQUARE;
		synth.osc[2].type = synth.osc[2].SQUARE;
		synth.osc[0].detune.value = 0;
		synth.osc[1].detune.value = -1200;
		synth.osc[2].detune.value = -2400;
		synth.osc.forEach(function(osc) {
			osc.frequency.setValueAtTime(freq, 0);
		});
		synth.start(0);
		synth.output.gain.value = 2;
		return synth;
	}

	// $("#reverb-input").addEventListener("change", function() {
		// readFileToAudioBuffer(this.files[0], context, function(buffer) {
			// reverb.buffer = buffer;
		// });
	// }, false);

	// reverb.connect(context.destination);

	compressor.connect(context.destination);

	vocoder.initModulator();
	vocoder.output.connect(compressor);

	delay.delayTime.value = 0.08; // delay synth to sync with microphone
	delay.connect(vocoder.carrierInput);

	/// Keyboard interaction
	var notes = {};

	keyboard.keyDown(function(note, freq) {
		if (notes[note]) return;

		var synth = makeSynth(freq);
		synth.output.connect(delay);
		notes[note] = synth;
	});

	keyboard.keyUp(function(note, freq) {
		var synth = notes[note];
		if (!synth) return;
		var releaseTime = 0.5;

		synth.output.gain.setTargetAtTime(0, 0, releaseTime / 5);
		setTimeout(function() {
			synth.output.disconnect();
		}, 1000 * releaseTime);
		delete notes[note];
	});
})();
