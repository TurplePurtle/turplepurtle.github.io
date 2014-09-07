
(function(exports) {
    "use strict";

    window.AudioContext = window.AudioContext || window.webkitAudioContext;


    function Synth(context) {
        this.context = context;
        this.voices = [];
        this.free = [];
        this.used = {};
        this.output = context.createGain();
    }
    Synth.prototype.create = function() {
        var voice = {
            id: this.voices.length,
            osc: this.context.createOscillator(),
            gain: this.context.createGain(),
        };
        voice.osc.type = "sawtooth";
        voice.gain.gain.value = 0;
        voice.osc.start(0);

        voice.osc.connect(voice.gain);
        voice.gain.connect(this.output);

        this.voices.push(voice);

        return voice;
    };
    Synth.prototype.play = function(id, freq, t) {
        var voice = this.free.pop() || this.create();
        voice.osc.frequency.setValueAtTime(freq, t);
        voice.gain.gain.setValueAtTime(1, t);

        this.used[id] = voice;
    };
    Synth.prototype.stop = function(id, t) {
        var voice = this.used[id];
        voice.gain.gain.setValueAtTime(0, t);
        this.free.push(voice);
        delete this.used[id];
    };
    Synth.prototype.generateEventList = function(noteList) {
        var eventList = [];

        for (var i = 0; i < noteList.length; i++) {
            var note = noteList[i];
            var startNoteEvent = {
                noteId: note.id,
                time: 0.25 * note.time,
                eventType: 1,
                noteFreq: note.frequency(),
            };
            var stopNoteEvent = {
                noteId: note.id,
                time: 0.25 * (note.time + note.duration),
                eventType: 2,
            };
            eventList.push(startNoteEvent);
            eventList.push(stopNoteEvent);
        }

        eventList.sort(function(a, b) { return a.time - b.time });

        return eventList;
    };
    Synth.prototype.schedule = function(noteList) {
        var eventList = this.generateEventList(noteList);
        var startTime = this.context.currentTime;

        for (var i = 0; i < eventList.length; i++) {
            var ev = eventList[i];
            var schedTime = ev.time + startTime;

            if (ev.eventType === 1) {
                this.play(ev.noteId, ev.noteFreq, schedTime);
            } else if (ev.eventType === 2) {
                this.stop(ev.noteId, schedTime);
            }
        }
    };
    Synth.prototype.halt = function() {
        for (var i = 0; i < this.voices.length; i++) {
            var voice = this.voices[i];
            voice.osc.frequency.cancelScheduledValues(0);
            voice.gain.gain.cancelScheduledValues(0);
            voice.gain.gain.setValueAtTime(0,0);
        }
    };


    exports.Musicker = exports.Musicker || {};
    exports.Musicker.Synth = Synth;

})(window);
