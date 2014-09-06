
(function(exports) {
    "use strict";

    window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;


    function Note(x, y, editor) {
        if (x < 0 || y < 0)
            throw new Error("Invalid X/Y for note");

        this.editor = editor;
        this.x = this.gridifyX(x);
        this.y = this.gridifyY(y);
        this.duration = 4 * this.editor.gridX;
        this.time = this.pxToTime(x);
        this.pitch = this.pxToPitch(y);
        this.node = this.generateDOM();
    }

    Note.prototype.gridifyX = function(x) {
        var gridX = this.editor.gridX;
        return (x / gridX | 0) * gridX;
    };
    Note.prototype.gridifyY = function(y) {
        var gridY = this.editor.gridY;
        return (y / gridY | 0) * gridY;
    };
    Note.prototype.degridifyX = function(gx) {
        return gx / this.editor.gridX;
    };
    Note.prototype.degridifyY = function(gy) {
        return gy / this.editor.gridY;
    };
    Note.prototype.pxToTime = function(x) {
        return this.degridifyX(this.x);
    };
    Note.prototype.pxToPitch = function(y) {
        return this.degridifyY(this.y);
    };
    Note.prototype.resizePx = function(x) {
        var pxDur = this.gridifyX(x);
        this.node.style.width = pxDur + "px";
        this.duration = this.pxToTime(pxDur);
    };
    Note.prototype.movePx = function(x, y) {
        var gx = this.gridifyX(x);
        var gy = this.gridifyY(y);
        if (gx === this.x && gy === this.y) return;
        this.x = gx;
        this.y = gy;
        this.time = this.pxToTime(gx);
        this.pitch = this.pxToPitch(gy);
        this.node.style.left = gx + "px";
        this.node.style.top = gy + "px";
    };
    Note.prototype.generateDOM = function() {
        var node = document.createElement("div");
        node.classList.add("music-note");
        node.style.left = this.x + "px";
        node.style.top = this.y + "px";
        node.style.width = this.duration + "px";

        var self = this;

        // Note moving
        this.moving = false;
        node.addEventListener("mousedown", function(e) {
            if (e.target === e.currentTarget) {
                self.moving = true;
            }
        }, false);
        this.editor.div.addEventListener("mousemove", function(e) {
            if (!self.moving) return;
            var rect = self.editor.getRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;
            self.movePx(x, y);
        }, false);
        window.addEventListener("mouseup", function(e) {
            self.moving = false;
        }, false);

        // Note resizing
        // TO DO: move this to editor so there is only one listener
        // for all the notes
        var stretch = document.createElement("div");
        stretch.classList.add("music-note-stretch");

        this.resizing = false; // this.editor.resizing = this;
        stretch.addEventListener("mousedown", function(e) {
            self.resizing = true;
        }, false);
        this.editor.div.addEventListener("mousemove", function(e) {
            if (!self.resizing) return;
            var rect = self.editor.getRect();
            self.resizePx(e.clientX - rect.left - self.x);
        }, false);
        window.addEventListener("mouseup", function(e) {
            self.resizing = false;
        }, false);

        node.appendChild(stretch);

        return node;
    };
    Note.prototype.frequency = function() {
        return 55 * Math.pow(2, (this.pitch - 33) / 12);
    };


    function Editor(div) {
        this.containerDiv = div;
        this.div = null;
        this.noteList = [];
        this.gridX = 10;
        this.gridY = 20;
        this.height = 1600;
        this.init();
    }
    Editor.prototype.init = function() {
        // Piano notes
        var keyboard = document.createElement("ol");
        keyboard.classList.add("music-keyboard");
        keyboard.style.height = this.height + "px";

        for (var i = 0, n = this.height / 20; i < n; i++) {
            var key = document.createElement("li");
            var name = Editor.midiToName(i+1);
            key.textContent = name;
            if (name.charAt(1) === "#") {
                key.classList.add("black");
            }
            keyboard.appendChild(key);
        }

        this.containerDiv.appendChild(keyboard);

        // Note Area
        var div = document.createElement("div")
        this.div = div;
        div.classList.add("music-editor");
        div.style.height = this.height + "px";
        this.containerDiv.appendChild(div);
        this.drawGrid(this.gridX, this.gridY);

        var self = this;
        var clickHandler = function(e) {
            if (e.target !== self.div) return;

            var
            x = e.layerX,
            y = e.layerY;

            self.addNoteXY(x, y);
        };

        div.addEventListener("mousedown", clickHandler, false);
    };
    Editor.prototype.drawGrid = function(w, h) {
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");

        canvas.width = w;
        canvas.height = h;
        ctx.strokeStyle = "#777";
        ctx.beginPath();
        ctx.moveTo(0,h);
        ctx.lineTo(0,0);
        ctx.lineTo(w,0);
        ctx.stroke();

        this.div.style.backgroundImage =
            "url(" + canvas.toDataURL("image/png") + ")";
    }
    Editor.prototype.addNoteXY = function(x, y) {
        var note = new Note(x, y, this);
        this.noteList.push(note);
        this.div.appendChild(note.node);
    };
    Editor.prototype.getRect = function() {
        return this.div.getBoundingClientRect();
    };

    Editor.NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    Editor.midiToName = function(num) {
        var note = Editor.NOTES[num % 12];
        var oct = (num / 12 | 0) - 1;
        return note + oct;
    };

    exports.Musicker = exports.Musicker || {};
    exports.Musicker.Editor = Editor;
    exports.Musicker.Note = Note;

})(window);
