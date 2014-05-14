
window.AudioContext = window.AudioContext || window.webkitAudioContext;
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

function createGoertzelFilter(context, freq) {
    
    if (typeof freq !== "number") throw new Error("Need frequency!");
    
    var
    w = 2*Math.PI * freq / context.sampleRate,
    wr = Math.cos(w),
    wi = Math.sin(w),
    coeff = 2 * wr,
    g = context.createScriptProcessor(256, 1, 1);
    
    g.wr = wr;
    g.wi = wi;
    g.coeff = coeff;
    
    g.onaudioprocess = function(e) {
        var
        inp = e.inputBuffer.getChannelData(0),
        N = inp.length,
        coeff = this.coeff,
        s1 = 0,
        s2 = 0;
        
        for (var n = 0; n < N; n+=2) {
            s2 = inp[n] + coeff * s1 - s2;
            s1 = inp[n+1] + coeff * s2 - s1;
        }
        
        var
        XKr = s1 * this.wr - s2,
        XKi = s1 * this.wi,
        res = (XKr*XKr + XKi*XKi) / N;
        
        this.res = res;
    };

    return g;
}

var
fCutoff = 20000,
fLow = 21000,
fHigh = 21375;

var context = new AudioContext;
var filter = context.createBiquadFilter();
var gLow = createGoertzelFilter(context, fLow);
var gHigh = createGoertzelFilter(context, fHigh);

filter.type = "highpass";
filter.frequency.value = fCutoff;

navigator.getUserMedia({audio: true, video: false},
    function(stream) {
        var mic = context.createMediaStreamSource(stream);
        mic.connect(filter);
    },
    (console.warn || console.log).bind(console)
);

filter.connect(gLow);
filter.connect(gHigh);
gLow.connect(context.destination);
gHigh.connect(context.destination);

var osc = context.createOscillator();

osc.frequency.value = 0;
osc.start(0);
osc.connect(context.destination);

function demodValue() {
    var val = -1;
    var thresh = 1e-5;
    if (gLow.res > thresh || gHigh.res > thresh) {
        val = gHigh.res > gLow.res ? 1 : 0;
        console.log(val);
    }
    return val;
}
setInterval(demodValue, 100);

// Pulse button
var button = document.createElement("button");
button.textContent = "Pulse";
document.body.appendChild(button);
button.onclick = function() {
    var t = context.currentTime;
    for (var i = 1; i <= 10; i+=2) {
        osc.frequency.setValueAtTime(fLow, t + i*0.1);
        osc.frequency.setValueAtTime(fHigh, t + (i+1)*0.1);
    }
    osc.frequency.setValueAtTime(0, t + 11*0.1);
};
