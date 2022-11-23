(function() {

/* Graph:
	[osc -> gain] \
	[osc -> gain] ->- gain(output)
	[osc -> gain] /
*/

var O = function(context) {
	var self = this;

	this.context = context;
	this.osc = [1, 2, 3].map(function() {
		return context.createOscillator();	
	});
	this.oscGains = this.osc.map(function(osc) {
		var gainNode = context.createGain();
		osc.gainNode = gainNode;
		osc.gain = gainNode.gain;
		return gainNode;
	});
	this.gain = context.createGain();
	this.output = this.gain;
	
	this.osc[0].detune.value = 0;
	this.osc[1].detune.value = -1200;
	this.osc[2].detune.value = -2400;
	this.osc.forEach(function(osc, i) {
		osc.connect(osc.gainNode);
		osc.gainNode.connect(self.output);
	});
};

O.prototype.start = function(t) {
	for (var i=0; i<3; i++) {
		this.osc[i].start(t);
	}
};

O.prototype.setFrequency = function(freq) {
	for (var i=0; i<3; i++) {
		// this.osc[i].frequency.value = freq;
		this.osc[i].frequency.setValueAtTime(freq, 0);
	}
};

window.OscX3 = O;

})();
