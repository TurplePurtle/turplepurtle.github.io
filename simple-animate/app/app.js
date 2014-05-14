
var app = {
    overlay: null,
    activeFrame: null,
    frames: [],
    canvasCount: 0,
    viewWidth: 400,
    viewHeight: 300,
    buffer: $.make("canvas").getContext("2d"),
    tools: {},
    canvasContainer: $("#canvas-container"),
    toolContainer: $("#tool-box .container"),
    layerContainer: $("#layer-box .container"),
    thumbContainer: $("#thumb-box .container"),
    copyLayerRef: null,
    actions: {done: [], undone: [], current: null}
};

app.overlay = $.make("canvas", {
    width: app.viewWidth,
    height: app.viewHeight,
    className: "overlay"
}, app.canvasContainer).getContext("2d");

app.exportGIF = function() {
    var fpsInput = $("#gif-fps-input");
    var fps = +fpsInput.value;
    if (!fps || fps <= 0) fps = 12;
    fpsInput.value = fps;
    // var transparent = parseInt(
        // prompt("Enter hex value of transparent color","ffffff"), 16);
    // if (!transparent) transparent = 0xffffff;
    // transparent = Math.min(Math.max(transparent, 0), 0xffffff);
    var encoder = new GIFEncoder();
    encoder.start();
    encoder.setRepeat(0);
    encoder.setFrameRate(fps);
    // encoder.setTransparent("#ffffff");

    app.buffer.canvas.width = app.viewWidth;
    app.buffer.canvas.height = app.viewHeight;
    app.buffer.fillStyle = "#fff";
    app.frames.forEach(function(frame) {
        app.buffer.fillRect(0, 0, app.viewWidth, app.viewHeight);
        var i = frame.layers.length;
        while (i-- > 0) {
            app.buffer.drawImage(frame.layers[i].canvas, 0, 0);
        }
        encoder.addFrame(app.buffer);
    });
    encoder.finish();
    return encoder.stream().getData();
};

app.getActiveLayer = function() {
    return app.activeFrame && app.activeFrame.activeLayer;
};

app.deselectTools = function() {
    var activeTools = $(".active", true, app.toolContainer);
    for (var i = 0; i < activeTools.length; i++) {
        activeTools[i].classList.remove("active");
    }
};

app.selectToolButton = function() {
    app.deselectTools();
    this.classList.add("active");
    app.pen.activeTool = this.getAttribute("data-tool-name");
};

app.selectTool = function(toolName) {
    if (!(toolName in app.tools)) throw new Error("Tool does not exist.");
    app.deselectTools();
    app.tools[toolName].button.classList.add("active");
    app.pen.activeTool = toolName;
};

app.pushNewAction = function(action) {
    if (!action || !action.type) throw new Error("Action type required.");
    var acts = app.actions;
    acts.done.push(action);
    if (acts.done.length > 15) acts.done.shift();
    acts.undone.length = 0;
    return action;
};

app.Layer = function(frame) {
    var self = this;
    app.canvasCount += 1;
    if (!frame) throw new Error("Frame required to create layer.");
    this.frame = frame;
    this.canvas = $.make("canvas", {
        width: app.viewWidth,
        height: app.viewHeight,
        className: "layer-" + app.canvasCount
    });
    this.ctx = this.canvas.getContext("2d");
    this.thumb = $.make("div", {
        className: "thumb",
        onclick: function() { self.select(); }
    });

    this.insert(frame.activeLayer).select();
};

app.Layer.prototype.insert = function(nextTo) {
    if (nextTo) {
        this.frame.layers.splice(this.frame.layers.indexOf(nextTo), 0, this);
    } else {
        this.frame.layers.push(this);
    }
    // DOM
    this.frame.canvasGroup.appendChild(this.canvas);
    if (nextTo) {
        this.frame.layerThumbGroup.insertBefore(this.thumb, nextTo.thumb);
    } else {
        this.frame.layerThumbGroup.appendChild(this.thumb);
    }
    this.frame.updateZIndices();
    return this;
};

app.Layer.prototype.remove = function() {
    var layers = this.frame.layers;
    this.frame.activeLayer = $.getNeighbor(this, layers, true, false);
    layers.splice(layers.indexOf(this), 1);
    this.thumb.classList.remove("active");
    $.removeElement(this.canvas);
    $.removeElement(this.thumb);

    if (this.frame.activeLayer) this.frame.activeLayer.select();
    this.updateFrameThumb();
    return this;
};

app.Layer.prototype.updateThumb = function() {
    var width = this.thumb.offsetWidth-2; // subtract 2*border-width
    var height = this.thumb.offsetHeight-2;
    app.buffer.canvas.width = width;
    app.buffer.canvas.height = height;
    app.buffer.clearRect(0, 0, width, height);
    app.buffer.drawImage(this.canvas, 0, 0, width, height);
    this.thumb.style.backgroundImage =
        "url('" + app.buffer.canvas.toDataURL() + "')";
    return this;
};

app.Layer.prototype.updateFrameThumb = function() {
    this.updateThumb();
    this.frame.updateThumb();
    return this;
};

app.Layer.prototype.paste = function(canvas) {
    this.ctx.drawImage(canvas, 0, 0);
    return this;
};

app.Layer.prototype.clear = function() {
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    return this;
};

app.Layer.prototype.merge = function(layer2) {
    if (!layer2) throw new Error("Destination layer required.");
    layer2.paste(this.canvas);
    this.remove();
    layer2.updateFrameThumb();
    return this;
};

app.Layer.prototype.select = function() {
    this.frame.activeLayer = this;

    var activeLayers = $(".active", true, this.thumb.parentNode);
    var i = activeLayers.length;
    while (i-- > 0) {
        activeLayers[i].classList.remove("active");
    }
    this.thumb.classList.add("active");
    return this;
};

app.Layer.prototype.move = function(downward) {
    var neighbor = $.getNeighbor(this, this.frame.layers, downward, true);
    if (neighbor)
        app.swapFrameOrLayer(this.frame.layers, this, neighbor, true);
    return !!neighbor;
};

app.Layer.prototype.loadURL = function(url, callback) {
    var self = this, img = new Image;
    img.onload = function() {
        self.paste(this);
        if (callback && callback.call) callback.call(self);
    };
    img.src = url;
    return this;
};

app.Layer.prototype.offset = function(xOff, yOff) {
    app.buffer.canvas.width = this.canvas.width;
    app.buffer.canvas.height = this.canvas.height;
    app.buffer.drawImage(this.canvas, xOff, yOff);
    this.clear().paste(app.buffer.canvas).updateFrameThumb();
    return this;
};

app.Layer.prototype.pushNewAction = function(action) {
    if (!action.target) action.target = this;
    if (action.type === "edit" && !action.data) {
        action.data = this.canvas.toDataURL();
    }
    app.pushNewAction(action);
    return this;
};

app.Frame = function(skipNewLayer) {
    var self = this;
    this.layers = [];
    this.layerThumbGroup = $.make("div", {className: "group"});
    this.canvasGroup = $.make("div", {className: "group"});
    this.thumb = $.make("div", {
        id: "frame-thumb-" + app.canvasCount,
        className: "thumb",
        onmousedown: function() { self.select() }
    });

    this.insert(app.activeFrame).select();
    if (!skipNewLayer)
        new app.Layer(this);
};

app.Frame.prototype.insert = function(nextTo) {
    app.layerContainer.appendChild(this.layerThumbGroup);
    app.canvasContainer.appendChild(this.canvasGroup);

    var nextToIndex = !nextTo ? -1 : app.frames.indexOf(nextTo);
    if (nextToIndex > -1) {
        if (nextToIndex < app.frames.length - 1) {
            app.frames.splice(nextToIndex + 1, 0, this);
            app.thumbContainer.insertBefore(this.thumb,
                nextTo.thumb.nextElementSibling);
        } else {
            app.frames.push(this);
            app.thumbContainer.appendChild(this.thumb);
        }
    } else {
        app.frames.push(this);
        app.thumbContainer.appendChild(this.thumb);
    }

    return this;
};

app.Frame.prototype.remove = function() {
    app.activeFrame = $.getNeighbor(this, app.frames, true, false);
    app.frames.splice(app.frames.indexOf(this), 1);

    this.thumb.classList.remove("active");
    $.removeElement(this.canvasGroup);
    $.removeElement(this.layerThumbGroup);
    $.removeElement(this.thumb);

    if (app.activeFrame) {
        app.activeFrame.select();
    }
    return this;
}

app.Frame.prototype.duplicate = function() {
    var selectedFrameIndex = this.layers.indexOf(this.activeLayer);
    var newFrame = new app.Frame(true);
    var i = this.layers.length;
    while (i-- > 0) {
        var newLayer = new app.Layer(newFrame);
        newLayer.paste(this.layers[i].canvas).updateThumb();
    }
    newFrame.layers[selectedFrameIndex].select();
    newFrame.updateThumb();
    return this;
};

app.Frame.prototype.select = function() {
    app.activeFrame = this;

    var activeFrames, activeLayers, activeThumbs, i;

    // Show/hide canvas
    activeFrames = $(".active.group", true, app.canvasContainer);
    i = activeFrames.length;
    while (i-- > 0) {
        activeFrames[i].classList.remove("active");
    }
    this.canvasGroup.classList.add("active");
    // Show/hide layer group
    activeLayers = $(".active.group", true, app.layerContainer);
    i = activeLayers.length;
    while (i-- > 0) {
        activeLayers[i].classList.remove("active");
    }
    this.layerThumbGroup.classList.add("active");

    // Set active frame thumbnail
    activeThumbs = $(".active", true, app.thumbContainer);
    i = activeThumbs.length;
    while (i-- > 0) {
        activeThumbs[i].classList.remove("active");
    }
    this.thumb.classList.add("active");

    // scroll to thumb
    // unfortunately, this method fills your history with garbage
    // location.hash = "";
    // location.hash = this.thumb.id;
    // location.hash = "";
    return this;
};

app.Frame.prototype.move = function(rightward) {
    var neighbor = $.getNeighbor(this, app.frames, rightward, true);
    if (neighbor)
        app.swapFrameOrLayer(app.frames, this, neighbor, false);
    return !!neighbor;
};

app.Frame.prototype.updateThumb = function() {
    var width = this.thumb.offsetWidth-2; // subtract 2*border-width
    var height = this.thumb.offsetHeight-2;
    app.buffer.width = width;
    app.buffer.height = height;

    // First update layer thumb
    // this.activeLayer && this.activeLayer.updateThumb();

    // Then update frame thumb
    app.buffer.clearRect(0, 0, width, height);
    var i = this.layers.length;
    while (i-- > 0) {
        app.buffer.drawImage(this.layers[i].canvas, 0, 0, width, height);
    }
    this.thumb.style.backgroundImage =
        "url('" + app.buffer.canvas.toDataURL() + "')";
    return this;
};

app.Frame.prototype.updateZIndices = function() {
    for (var i = 0, n = this.layers.length; i < n; i++) {
        this.layers[i].canvas.style.zIndex = n - i;
    }
    return this;
};

app.Frame.prototype.pushNewAction = function(action) {
    if (!action.target) action.target = this;
    app.pushNewAction(action);
    return this;
};

app.swapFrameOrLayer = function(arr, f1, f2, isLayer) {
    if (!f1 || !f2) return;
    i1 = arr.indexOf(f1);
    i2 = arr.indexOf(f2);
    if (i1 < 0 || i2 < 0) return;
    arr[i1] = f2;
    arr[i2] = f1;
    $.swapElementSiblings(f1.thumb, f2.thumb);
    if (isLayer) {
        $.swapElementSiblings(f1.canvas, f2.canvas);
        f1.frame.updateZIndices();
    }
};

app.createTool = function(toolName, buttonText, onactivate, hotkey) {
    var tool = {};
    tool.button = $.make("button", {
        className: "tool",
        innerHTML: buttonText
    }, app.toolContainer);
    tool.button.setAttribute("data-tool-name", toolName);
    if (onactivate) {
        tool.activate = onactivate;
        tool.button.addEventListener("click", onactivate, false);
    }
    if (hotkey) {
        key(hotkey, function() {onactivate.call(tool.button)});
    }
    app.tools[toolName] = tool;
    return tool;
};

app.createPenTool = function(toolName, buttonText, ondraw, onoverlay, hotkey) {
    if (typeof ondraw !== "function") throw new Error("ondraw required.");
    if (typeof onoverlay !== "function") throw new Error("onoverlay required");
    var tool = app.createTool(toolName, buttonText,
        app.selectToolButton, hotkey);
    tool.draw = ondraw;
    tool.drawOverlay = onoverlay;

    return tool;
};

app.pen = {
    isDown: false,
    isEraser: false,
    pos: Int32Array && new Int32Array(6) || new Array(6),
    pressure: 1,
    diameter: 6,
    eraserDiameter: 30,
    activeTool: "",
    color: "#333333"
};

app.pen.getPos = function(e) {
    var pen = this;
    pen.pos[5] = pen.pos[3]; // last-last Y
    pen.pos[4] = pen.pos[2]; // last-last X
    pen.pos[3] = pen.pos[1]; // last Y
    pen.pos[2] = pen.pos[0]; // last X
    if (pen.penAPI) {
        pen.pressure = pen.penAPI.pressure || 1;
        pen.isEraser = pen.penAPI.isEraser || false;
    }

    if (typeof e.pageX === "number") {
        var parent = app.canvasContainer.parentNode;
        pen.pos[0] = e.pageX - parent.offsetLeft;
        pen.pos[1] = e.pageY - parent.offsetTop;
    } else if (typeof e.offsetX === "number") {
        pen.pos[0] = e.offsetX;
        pen.pos[1] = e.offsetY;
    } else if (typeof e.layerX === "number") {
        pen.pos[0] = e.layerX;
        pen.pos[1] = e.layerY;
    }
};

function pluginLoaded() {
    var wtPlugin = $("#wtPlugin");
    app.pen.penAPI = wtPlugin && wtPlugin.penAPI;
}

(function() {
    var pen = app.pen;

    new app.Frame(true);

    var drawAction = null;
    function canvasMouseUp(e) {
        if (pen.isDown) {
            pen.isDown = false;
            var layer = app.getActiveLayer();
            if (layer) {
                app.tools[pen.activeTool].draw(layer.ctx, 3);
                layer.updateFrameThumb();
                drawAction.data = layer.canvas.toDataURL();
                drawAction = null;
            }
        }
    }
    function canvasMouseDown(e) {
        if (e.touches) {
            e.preventDefault();
            e = e.touches[0];
        }
        pen.isDown = true;
        pen.getPos(e);
        pen.getPos(e);
        var layer = app.getActiveLayer();
        if (layer) {
            drawAction = app.pushNewAction({
                type: "edit",
                target: layer,
                dataPre: layer.canvas.toDataURL()
            });
            app.tools[pen.activeTool].draw(layer.ctx, 1);
        }
    }
    var isMouseMoveDrawQueued = false;
    function canvasMouseMoveDraw() {
        var tool = app.tools[pen.activeTool];
        if (pen.isDown) {
            var layer = app.getActiveLayer();
            if (layer) {
                tool.draw(layer.ctx, 2);
            }
        }
        if (tool.drawOverlay) {
            tool.drawOverlay(app.overlay);
        }
        isMouseMoveDrawQueued = false;
    }
    function canvasMouseMove(e) {
        if (e.touches) {
            if (pen.isDown) e.preventDefault();
            e = e.touches[0];
        }
        if (!isMouseMoveDrawQueued) {
            pen.getPos(e);
            requestAnimationFrame(canvasMouseMoveDraw);
            isMouseMoveDrawQueued = true;
        }
    }

    app.overlay.canvas.addEventListener("mousedown", canvasMouseDown, false);
    app.overlay.canvas.addEventListener("touchstart",canvasMouseDown, false);
    window.addEventListener("mouseup", canvasMouseUp, false);
    window.addEventListener("touchend",canvasMouseUp, false);
    window.addEventListener("mousemove", canvasMouseMove, false);
    window.addEventListener("touchmove", canvasMouseMove, false);

    var toolDiameterSlider = $("#tool-diameter-slider");
    $("#tool-diameter-value").innerHTML =
        toolDiameterSlider.value =
            pen.diameter;
    toolDiameterSlider.onchange = function() {
        pen.diameter = +this.value;
        $("#tool-diameter-value").innerHTML = pen.diameter;
    };
    key("[", function() {
        var lastVal = +toolDiameterSlider.value;
        toolDiameterSlider.value = lastVal > 10 ?
            Math.round(lastVal*0.9) : lastVal - 1;
        toolDiameterSlider.onchange();
    });
    key("]", function() {
        var lastVal = +toolDiameterSlider.value;
        toolDiameterSlider.value = lastVal > 10 ?
            Math.round(lastVal*1.1) : lastVal + 1;
        toolDiameterSlider.onchange();
    });

    var colorPicker = $("#pen-color-picker");
    if (colorPicker.type === "text") {
        colorPicker.className = "color";
        jscolor && jscolor.bind();
    }
    colorPicker.value = pen.color;
    colorPicker.onchange = function() {
        pen.color = this.value;
    };

    $("#new-frame-button").onclick = function() {
        var nextTo = app.activeFrame;
        new app.Frame(false).pushNewAction({
            type: "newframe",
            nextTo: nextTo
        });
    };
    key("ctrl+shift+f", $("#new-frame-button").onclick);
    $("#duplicate-frame-button").onclick = function() {
        var frame = app.activeFrame;
        frame.duplicate().pushNewAction({ type: "newframe", nextTo: frame });
    };
    $("#delete-frame-button").onclick = function() {
        app.activeFrame.pushNewAction({
            type: "deleteframe",
            nextTo: $.getNeighbor(app.activeFrame, app.frames, false, false)
        }).remove();
    };
    $("#move-frame-left-button").onclick = function() {
        app.activeFrame && app.activeFrame.move(false);
    };
    $("#move-frame-right-button").onclick = function() {
        app.activeFrame && app.activeFrame.move(true);
    };
    var newLayerButton = $("#new-layer-button");
    (newLayerButton.onclick = function() {
        if (app.activeFrame) {
            var layer = app.getActiveLayer();
            new app.Layer(app.activeFrame).pushNewAction({
                type: "newlayer",
                nextTo: layer
            });
        }
    })(); // invoked immediately to create new layer
    key("ctrl+alt+shift+n", function() { newLayerButton.onclick() });
    $("#merge-down-layer-button").onclick = function() {
        var layer = app.getActiveLayer();
        if (!layer) return;
        var target = $.getNeighbor(layer, layer.frame.layers, true, true);
        if (!target) return;

        layer.pushNewAction({
            type: "mergedlayer",
            target2: target,
            data: target.canvas.toDataURL()
        }).merge(target);
    };
    $("#delete-layer-button").onclick = function() {
        var layer = app.getActiveLayer();
        if (layer) {
            var layers = layer.frame.layers;
            var nextTo = $.getNeighbor(layer, layers, true, false);
            layer.remove().pushNewAction({
                type: "deletelayer",
                nextTo: nextTo
            });
        }
    };
    $("#copy-layer-button").onclick = function() {
        var layer = app.getActiveLayer();
        if (layer) {
            app.copyLayerRef = layer;
        }
    };
    $("#paste-layer-button").onclick = function() {
        if (!app.copyLayerRef || !app.activeFrame) return;
        var nextTo = app.getActiveLayer();
        new app.Layer(app.activeFrame)
            .paste(app.copyLayerRef.canvas)
            .updateFrameThumb()
            .pushNewAction({
                type: "pastelayer",
                nextTo: nextTo
            });
    };
    $("#move-layer-up-button").onclick = function() {
        var layer = app.getActiveLayer();
        if (layer && layer.move(false))
            layer.pushNewAction({ type: "movelayerup" });
    };
    key("ctrl+shift+up", $("#move-layer-up-button").onclick);
    $("#move-layer-down-button").onclick = function() {
        var layer = app.getActiveLayer();
        if (layer && layer.move(true))
            layer.pushNewAction({ type: "movelayerdown" });
    };
    key("ctrl+shift+down", $("#move-layer-down-button").onclick);
    $("#export-gif-button").addEventListener("click", function() {
        var w = open("", "Gif" + Date.now(),
            "width=" + (app.viewWidth+20) + ",height=" + (app.viewHeight+60));
        var img = w.document.createElement("img");
        var gifData = btoa(app.exportGIF());
        img.src = "data:image/gif;base64," + gifData;
        w.document.body.appendChild(img);
        w.document.title = "New Gif | SimpleAnimateTool";

        $.make("button", {
            innerHTML: "Upload to imgur",
            id: "upload-to-imgur-button",
            onclick: function() {
                var ww = window.open();
                imgurUpload(gifData, function(response) {
                    var data = JSON.parse(response);
                    ww.location.href = data.upload.links.imgur_page;
                    $.removeElement(
                        $("#upload-to-imgur-button", false, w.document));
                    $.make("a", {
                        href: data.upload.links.imgur_page,
                        innerHTML: "Imgur link",
                        target: "_blank"
                    }, w.document.body, w);
                    $.make("a", {
                        href: data.upload.links.delete_page,
                        innerHTML: "Delete link",
                        target: "_blank"
                    }, w.document.body, w);
                }, function() {
                    $.make("p", {
                        innerHTML: "Upload failed :("
                    }, w.document.body, w);
                    console.log(response);
                });
            }
        }, w.document.body, w);
    }, false);
})();
