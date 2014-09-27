
(function(exports) {
    "use strict";

    var Recorderjs = exports.Recorder;
    if (!Recorderjs) throw new Error("Recorderjs not found.");

    var Musicker = exports.Musicker || {};
    exports.Musicker = Musicker;


    function Recorder(source, config) {
        this.context = source.context;
        this.source = source;
        this.recorderjs = new Recorderjs(source, config);
        this.buffer = null;
        this.bufferDirty = true;

        if (!this.context) throw new Error("Source has no audio context.");
    }

    Recorder.prototype.record = function() {
        this.bufferDirty = true;
        this.recorderjs.record();
    };
    Recorder.prototype.stop = function() {
        this.bufferDirty = true;
        this.recorderjs.stop();
    };
    Recorder.prototype.getBuffer = function(callback) {
        if (this.bufferDirty) {
            var self = this;
            this.recorderjs.getBuffer(function(buffers) {
                var context = self.context;
                var buffer = context.createBuffer(2, buffers[0].length, context.sampleRate);
                buffer.getChannelData(0).set(buffers[0]);
                buffer.getChannelData(1).set(buffers[1]);
                self.bufferDirty = false;
                self.buffer = buffer;

                callback(buffer);
            });
        } else {
            callback(this.buffer);
        }
    };

    Recorder.prototype.getBufferSource = function(callback) {
        var context = this.context;

        this.getBuffer(function(buffer) {
            var bufferSource = context.createBufferSource();
            bufferSource.buffer = buffer;
            callback(bufferSource);
        });
    };


    Musicker.Recorder = Recorder;

})(window);
