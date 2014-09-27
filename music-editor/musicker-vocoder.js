
(function(exports) {
    "use strict";

    var Musicker = exports.Musicker || {};
    exports.Musicker = Musicker;

    /* Graph:
      modulator -->- [bandpass -->- VU-meter ---v ]
      carrier   -->- [bandpass -->- gain] -->- gain -->- output

       VU-meter (envelope follower):
      -->- square -->- lowpass --> sqrt -->-
    */


    // VU-meter
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
    function maxSignal(ev) {
        var inp = ev.inputBuffer.getChannelData(0);
        var out = ev.outputBuffer.getChannelData(0);
        var max = 0;
        for (var i = 0, n = inp.length; i < n; ++i) {
            var val = Math.abs(inp[i]);
            if (val > max) {
                max = val;
            } else {
                out[i] = max;
            }
        }
    }

    function vocoderVUMeter(context, f0, bandwidth) {
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


    // Vocoder
    var Voc = function(context, numBands) {
        numBands = numBands || 32;

        /// Components
        this.context = context;
        this.gain = context.createGain();
        this.modulatorEnvelopes = [];
        this.modulatorGain = context.createGain();
        this.carrierGains = [];
        this.carrierFilters = [[], []];
        this.carrierGain = context.createGain();
        this.output = this.gain;
        this.carrierInput = this.carrierGain;
        this.modulatorInput = this.modulatorGain;
        this.modulator = null;
        this.numBands = numBands;
        /// Configuration
        this.freqBounds = this.getFrequencyBounds(200, 5000, numBands);
        this.initGainsAndFilters();
    }

    Voc.prototype.initGainsAndFilters = function() {
        var numBands = this.numBands;

        this.gain.gain.value = 1;
        this.carrierGain.gain.value = 1;
        this.modulatorGain.gain.value = 1;

        /// Nodes for each band on the carrier side
        for (var i = 0; i < numBands; i++) {
            var bandGain = context.createGain();
            var filter1 = context.createBiquadFilter();
            var filter2 = context.createBiquadFilter();
            var f0 = (this.freqBounds[i] + this.freqBounds[i+1]) / 2;
            var bandwidth = (this.freqBounds[i+1] - this.freqBounds[i]);

            /// Envelope follower
            var envelope = vocoderVUMeter(context, f0, bandwidth);
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
    };

    Voc.prototype.getFrequencyBounds = function(freqStart, freqEnd, numBands) {
        // bounds is an array of length (numBands + 1)
        // It defines the bounds for each band.
        // The bounds are spaced out logarithmically.
        var
        bounds = [],
        pStart = Math.log(freqStart),
        pEnd = Math.log(freqEnd),
        pDel = (pEnd - pStart) / numBands;

        for (var i = 0; i < numBands; i++) {
            bounds.push(Math.exp(pStart + i * pDel));
        }
        bounds.push(freqEnd);

        return bounds;
    };

    Voc.prototype.initModulator = function() {
        // Get microphone input
        var self = this;
        navigator.getUserMedia({audio: true, video: false}, function(stream) {
            self.modulator = self.context.createMediaStreamSource(stream);
            self.modulator.connect(self.modulatorInput);
        }, (console.warn||console.log).bind(console));
    };


    Musicker.Vocoder = Voc;

})(window);
