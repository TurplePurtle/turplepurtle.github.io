
(function(exports) {
    "use strict";

    var Musicker = exports.Musicker || {};
    exports.Musicker = Musicker;

    function Editor(div) {
        this.containerDiv = div;
        this.div = null;
        this.noteList = [];
        this.gridX = 10;
        this.gridY = 20;
        this.height = 10*12*20; // octaves * notes * px
        this.noteWidth = 4 * this.gridX;
        this.init();
    }
    Editor.prototype.init = function() {
        // Piano notes
        var keyboard = document.createElement("ol");
        keyboard.classList.add("music-keyboard");
        keyboard.style.height = this.height + "px";

        for (var i = this.height / 20; i > 0; i--) {
            var key = document.createElement("li");
            var name = Editor.midiToName(i);
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
        this.drawGrid(this.gridX, this.gridY, 4, 4);

        var self = this;
        var clickHandler = function(e) {
            if (e.target !== self.div) return;
            if (e.which === 1) {
                var rect = self.getRect();
                var x = e.clientX - rect.left;
                var y = e.clientY - rect.top;
                self.addNoteXY(x, y);
            }
        };

        div.addEventListener("mousedown", clickHandler, false);
        div.addEventListener("contextmenu", function(e) {
            e.preventDefault();
        }, false);

    };
    Editor.prototype.drawGrid = function(w, h, beat, measure) {
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");

        canvas.width = w * beat * measure;
        canvas.height = h;

        ctx.strokeStyle = "#ccc";
        ctx.beginPath();
        for (var i = 0; i < beat*measure; i++) {
            var x = i*w + 0.5;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = "#aaa";
        for (var i = 0; i < beat; i++) {
            var x = i*w*beat + 0.5;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
        }
        ctx.stroke();

        ctx.strokeStyle = "#333";
        ctx.beginPath();
        ctx.moveTo(0.5, h);
        ctx.lineTo(0.5, 0.5);
        ctx.lineTo(w*beat*measure, 0.5);
        ctx.stroke();

        this.div.style.backgroundImage =
            "url(" + canvas.toDataURL("image/png") + ")";
    };
    Editor.prototype.addNoteXY = function(x, y) {
        var note = new Musicker.Note(this.noteList.length, x, y, this);
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

    Musicker.Editor = Editor;

})(window);
