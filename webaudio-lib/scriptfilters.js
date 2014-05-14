
(function() {

	function setLPCoefficients(freq) {
		var NORM = 2 * Math.PI / this.context.sampleRate; // Hz -> radians/sample
		var alpha = (1 - Math.sin(freq * NORM)) / Math.cos(freq * NORM);
		var k = (1 - alpha) / 2;
	
		var coeff = this.coefficients;
		coeff[0] = k; // x[n]
		coeff[1] = k; // x[n-1]
		coeff[2] = 0; // x[n-2]
		coeff[3] = alpha; // y[n-1]
		coeff[4] = 0; // y[n-2]
	}

	function setBPCoefficients(freq, bwidth) {
		var NORM = 2 * Math.PI / this.context.sampleRate; // Hz -> radians/sample
		
		var beta = Math.cos(freq * NORM);
		var alpha = (1 - Math.sin(bwidth * NORM)) / Math.cos(bwidth * NORM);
		var k = (1 - alpha) / 2;
		
		var coeff = this.coefficients;
		coeff[0] = k; // x[n]
		coeff[1] = 0; // x[n-1]
		coeff[2] = -k; // x[n-2]
		coeff[3] = -beta*(1+alpha); // y[n-1]
		coeff[4] = alpha; // y[n-2]
	}
	
	function setPKCoefficients(freq, bwidth, gain) {
		// source: http://www.ti.com/lit/an/slaa447/slaa447.pdf
		var NORM = 2 * Math.PI / this.context.sampleRate; // Hz -> radians/sample
		var wo = freq * NORM;
		var bw = bwidth * NORM;

		// Intermediate parameters
		var A = Math.sqrt(gain);
		var alpha = Math.sin(wo) / (2 * A * wo / bw);

		// Peaking EQ coefficients
		var coeff = this.coefficients;
		var a0 = 1 + alpha / A; // y[n]
		// poles
		coeff[3] = -2 * Math.cos(wo) / a0; // y[n-1]
		coeff[4] = (1 - alpha / A) / a0; // y[n-2]
		// zeros
		a0 *= gain; // divide zeros by the "gain"
		coeff[0] = (1 + alpha * A) / a0; // x[n]
		coeff[1] = coeff[3] / gain; // x[n-1]
		coeff[2] = (1 - alpha * A) / a0; // x[n-2]
	}

	function createBiquadFilter(context) {
		var node = context.createJavaScriptNode(1024, 1, 1);
		node.coefficients = new Float32Array(5);
		node.last = new Float32Array(4); // remember values from last frame
		node.setBPCoefficients = setBPCoefficients;
		node.setLPCoefficients = setLPCoefficients;
		node.setPKCoefficients = setPKCoefficients;

		node.onaudioprocess = function(ev) {
			var inp = ev.inputBuffer.getChannelData(0);
			var out = ev.outputBuffer.getChannelData(0);
			var n = out.length;
			
			var last = this.last;
			var cf = this.coefficients;

			// if (n !== inp.length) return;
			
			// first two samples are special cases
			// they require cache from the last two samples
			// of the previous frame
			out[0] = cf[0] * inp[0] + cf[1] * last[1] + cf[2] * last[0];
			out[0] -= cf[3] * last[3] + cf[4] * last[2];
			out[1] = cf[0] * inp[1] + cf[1] * inp[0] + cf[2] * last[1];
			out[1] -= cf[3] * out[0] + cf[4] * last[3];
			
			for (var i = 2; i < n; ++i) {
				out[i] = cf[0] * inp[i] + cf[1] * inp[i-1] + cf[2] * inp[i-2];
				out[i] -= cf[3] * out[i-1] + cf[4] * out[i-2];
			}
			
			last[0] = inp[n-2]; // penultimate x
			last[1] = inp[n-1]; // last x
			last[2] = out[n-2]; // penultimate y
			last[3] = out[n-1]; // last y
		};
		
		return node;
	}
	
	window.createBiquadFilter = createBiquadFilter;
})();
