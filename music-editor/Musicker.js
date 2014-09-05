
(function(exports) {
    "use strict";

    var gridX = 20;
    var gridY = 20;
    
    window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;

    function Note(x, y, editor) {
        if (x < 0 || y < 0)
            throw new Error("Invalid X/Y for note");

        this.editor = editor;
        this.x = this.gridifyX(x);
        this.y = this.gridifyY(y);
        this.duration = 20;
        this.time = this.xToTime(x);
        this.pitch = this.yToPitch(y);
        this.node = this.generateDOM();
    }

    Note.prototype.gridifyX = function(x) {
        return (x / gridX | 0) * gridX;
    };
    Note.prototype.gridifyY = function(y) {
        return (y / gridY | 0) * gridY;
    };
    Note.prototype.xToTime = function(x) {
        return (x / gridX) | 0;
    };
    Note.prototype.yToPitch = function(y) {
        return (y / gridY) | 0;
    };
    Note.prototype.generateDOM = function() {
        var node = document.createElement("div");
        node.classList.add("music-note");
        node.style.left = this.x + "px";
        node.style.top = this.y + "px";
        node.style.width = this.duration + "px";

        var stretch = document.createElement("div");
        stretch.classList.add("music-note-stretch");
        
        // TO DO: move this to editor so there is only one listener
        // for all the notes
        this.resizing = false; // this.editor.resizing = this;
        var self = this;
        stretch.addEventListener("mousedown", function(e) {
            self.resizing = true;
        }, false);
        this.editor.div.addEventListener("mousemove", function(e) {
            if (!self.resizing) return;
            self.node.style.width = (self.gridifyX(e.layerX) - self.x) + "px";
        }, true);
        this.editor.div.addEventListener("mouseup", function(e) {
            self.resizing = false;
        }, false);
        
        node.appendChild(stretch);

        return node;
    };
    Note.prototype.frequency = function() {
        return 55 * Math.pow(2, (this.pitch - 33) / 12);
    };


    function Editor(div) {
        this.div = div;
        this.noteList = [];
        this.init();
    }
    Editor.prototype.init = function() {
        var self = this;
        var clickHandler = function(e) {
            if (e.target !== self.div) return;
            
            var
            x = e.layerX,
            y = e.layerY;

            self.addNoteXY(x, y);
        };

        this.div.addEventListener("click", clickHandler, false);
        this.drawGrid(gridX, gridY);
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

    exports.Musicker = exports.Musicker || {};
    exports.Musicker.Editor = Editor;
    exports.Musicker.Note = Note;
    
})(window);
