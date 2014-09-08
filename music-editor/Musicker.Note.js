
(function(exports) {
    "use strict";

    var Musicker = exports.Musicker || {};
    exports.Musicker = Musicker;

    function Note(id, x, y, editor) {
        if (x < 0 || y < 0)
            throw new Error("Invalid X/Y for note");

        this.id = id;
        this.editor = editor;
        this.x = this.gridifyX(x);
        this.y = this.gridifyY(y);
        this.w = this.editor.noteWidth;
        this.duration = this.pxToTime(this.w);
        this.time = this.pxToTime(this.x);
        this.pitch = this.pxToPitch(this.y);
        this.node = this.generateDOM();
    }

    Note.prototype.emit = function(eventName) {
        var e = new CustomEvent(eventName, {
            detail: this,
            cancelable: true,
        });
        return this.editor.dispatchEvent(e);
    };
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
        return this.degridifyX(x);
    };
    Note.prototype.pxToPitch = function(y) {
        return this.degridifyY(this.editor.height - y);
    };
    Note.prototype.resizePx = function(x) {
        var pxDur = this.gridifyX(x);
        this.node.style.width = pxDur + "px";
        this.w = pxDur;
        this.duration = this.pxToTime(pxDur);
        this.editor.noteWidth = pxDur;
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
    Note.prototype.remove = function() {

        this.node.parentNode.removeChild(this.node);

        var notes = this.editor.noteList;
        var ind = notes.indexOf(this);

        if (ind > -1) {
            var lastNote = notes.pop();
            if (this !== lastNote) {
                notes[ind] = lastNote;
            }
        } else {
            throw new Error("this should not happen");
        }
    };
    Note.prototype.generateDOM = function() {
        var node = document.createElement("div");
        node.classList.add("music-note");
        node.style.left = this.x + "px";
        node.style.top = this.y + "px";
        node.style.width = this.w + "px";

        var self = this;

        // Note moving / deleting
        this.moving = false;
        node.addEventListener("mousedown", function(e) {
            if (e.target === e.currentTarget) {
                switch (e.which) {
                    case 1:  // left-click
                        if (self.emit("notemovestart")) {
                            self.moving = true;
                        }
                        break;
                    case 3:  // right-click
                        if (self.emit("noteremove")) {
                            self.remove();
                        }
                        break;
                }
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
            if (e.which === 1) {
                if (self.moving) {
                    if (self.emit("notemoveend")) {
                        self.moving = false;
                    }
                }
            }
        }, false);

        // Note resizing
        // TO DO: move this to editor so there is only one listener
        // for all the notes
        var stretch = document.createElement("div");
        stretch.classList.add("music-note-stretch");

        this.resizing = false; // this.editor.resizing = this;
        stretch.addEventListener("mousedown", function(e) {
            if (e.which === 1) {
                if (self.emit("noteresizestart")) {
                    self.resizing = true;
                }
            }
        }, false);
        this.editor.div.addEventListener("mousemove", function(e) {
            if (!self.resizing) return;
            var rect = self.editor.getRect();
            self.resizePx(e.clientX - rect.left - self.x);
        }, false);
        window.addEventListener("mouseup", function(e) {
            if (e.which === 1) {
                if (self.resizing) {
                    if (self.emit("noteresizeend")) {
                        self.resizing = false;
                    }
                }
            }
        }, false);

        node.appendChild(stretch);

        return node;
    };
    Note.prototype.frequency = function() {
        return 55 * Math.pow(2, (this.pitch - 33) / 12);
    };

    Musicker.Note = Note;

})(window);
