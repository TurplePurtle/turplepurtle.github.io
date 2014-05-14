/// Set up us the audio
(function() {
	/* Graph:
		modulator -->- [bandpass -->- VU-meter ---v ]
		carrier   -->- [bandpass -->- gain] -->- gain -->- output
		
	   VU-meter (envelope follower):
		-->- square -->- lowpass --> sqrt -->-
	*/

	var V = function(context, numBands) {
		numBands = numBands || 32;
		
		/// Components
		this.context = context;
		this.gain = context.createGainNode();
		this.modulatorEnvelopes = [];
		this.modulatorGain = context.createGainNode();
		this.carrierGains = [];
		this.carrierFilters = [[], []];
		this.carrierGain = context.createGainNode();
		this.output = this.gain;
		this.carrierInput = this.carrierGain;
		this.modulatorInput = this.modulatorGain;
		this.modulator = null;

		// freqBounds is an array of length (numBands + 1)
		// It defines the bounds for each band.
		// The bounds are spaced out logarithmically.
		this.freqBounds = (function(freqStart, freqEnd, numBands) {
			var bounds = [];
			var pStart = Math.log(freqStart),
				pEnd = Math.log(freqEnd),
				pDel = (pEnd - pStart) / numBands;

			for (var i = 0; i < numBands; i++) {
				bounds.push(Math.exp(pStart + i * pDel));
			}
			bounds.push(freqEnd);
			return bounds;
		})(200, 5000, numBands);
		
		/// Configuration
		this.gain.gain.value = 1;
		this.carrierGain.gain.value = 1;
		this.modulatorGain.gain.value = 1;
		
		/// Nodes for each band on the carrier side
		for (var i = 0; i < numBands; i++) {
			var bandGain = context.createGainNode();
			var filter1 = context.createBiquadFilter();
			var filter2 = context.createBiquadFilter();
			var f0 = (this.freqBounds[i] + this.freqBounds[i+1]) / 2;
			var bandwidth = (this.freqBounds[i+1] - this.freqBounds[i]);

			/// Envelope follower
			var envelope = vocoderBandMeter(context, f0, bandwidth);
			this.modulatorGain.connect(envelope.input);
			this.modulatorEnvelopes.push(envelope);

			/// Gain node
			bandGain.gain.value = 0;
			bandGain.connect(this.gain);
			envelope.output.connect(bandGain.gain);
			this.carrierGains.push(bandGain);

			/// Second filter
			filter2.type = filter2.BANDPASS;
			filter2.frequency.value = f0;
			filter2.Q.value = f0 / bandwidth;
			filter2.connect(bandGain);
			this.carrierFilters[1].push(filter2);

			/// First filter
			filter1.type = filter1.BANDPASS;
			filter1.frequency.value = f0;
			filter1.Q.value = f0 / bandwidth;
			filter1.connect(filter2);
			this.carrierFilters[0].push(filter1);
			this.carrierGain.connect(filter1);
		}
	}
	
	V.prototype.initModulator = function() {
		// Get microphone input
		var self = this;
		navigator.getUserMedia({audio: true, video: false}, function(stream) {
			self.modulator = self.context.createMediaStreamSource(stream);
			self.modulator.connect(self.modulatorInput);
		}, (console.warn||console.log).bind(console));
	};
	
	window.Vocoder = V;
})();
