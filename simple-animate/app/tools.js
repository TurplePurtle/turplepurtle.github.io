(function() {
    var pen = app.pen;
    function roundOverlay(ctx) {
        ctx.clearRect(0, 0, app.viewWidth, app.viewHeight);
        ctx.beginPath();
        ctx.arc(pen.pos[0], pen.pos[1], pen.diameter/2,
            0, 2*Math.PI, false);
        ctx.stroke();
    }

    function squareOverlay(ctx) {
        var r = pen.diameter / 2;
        ctx.clearRect(0,0, ctx.canvas.width, ctx.canvas.height);
        ctx.strokeRect(pen.pos[0] - r, pen.pos[1] - r, 2*r, 2*r);
    }

    function crosshair(ctx) {
        ctx.clearRect(0,0, ctx.canvas.width, ctx.canvas.height);
        ctx.beginPath();
        ctx.moveTo(pen.pos[0] - 2.5, pen.pos[1] + 0.5);
        ctx.lineTo(pen.pos[0] + 4.5, pen.pos[1] + 0.5);
        ctx.moveTo(pen.pos[0] + 0.5, pen.pos[1] - 3.5);
        ctx.lineTo(pen.pos[0] + 0.5, pen.pos[1] + 3.5);
        ctx.stroke();
    }

    app.createPenTool("round-brush-a", "Round Brush *tablet", function(ctx, click) {
        var pen = app.pen;
        var diameter = 0;

        if (pen.isEraser) {
            ctx.globalCompositeOperation = "destination-out";
            diameter = pen.pressure * pen.eraserDiameter;
        } else {
            diameter = pen.pressure * pen.diameter;
        }
        if (click === 1) { // mousedown
            ctx.fillStyle = pen.color;
            ctx.beginPath();
            ctx.arc(pen.pos[0], pen.pos[1], diameter/2, 0, 2*Math.PI, false);
            ctx.fill();
        } else if (click === 2) { // mousemove
            ctx.strokeStyle = pen.color;
            ctx.lineWidth = diameter;
            ctx.lineCap = ctx.lineJoin = "round";
            ctx.beginPath();
            ctx.moveTo(
                (pen.pos[2] + pen.pos[4]) / 2,
                (pen.pos[3] + pen.pos[5]) / 2);
            ctx.quadraticCurveTo(
                pen.pos[2],
                pen.pos[3],
                (pen.pos[2] + pen.pos[0]) / 2,
                (pen.pos[3] + pen.pos[1]) / 2);
            ctx.stroke();
        } else if (click === 3) { // mouseup

        }
        if (pen.isEraser) {
            ctx.globalCompositeOperation = "source-over";
        }
    }, roundOverlay);

    app.createPenTool("round-brush", "Round Brush", function(ctx, click) {
        var pen = app.pen;

        if (click === 1) { // mousedown
            ctx.fillStyle = pen.color;
            ctx.beginPath();
            ctx.arc(pen.pos[0], pen.pos[1], pen.diameter/2, 0, 2*Math.PI, false);
            ctx.fill();
        } else if (click === 2) { // mousemove
            ctx.strokeStyle = pen.color;
            ctx.lineWidth = pen.diameter;
            ctx.lineCap = ctx.lineJoin = "round";
            ctx.beginPath();
            ctx.moveTo(
                (pen.pos[2] + pen.pos[4]) / 2,
                (pen.pos[3] + pen.pos[5]) / 2);
            ctx.quadraticCurveTo(
                pen.pos[2],
                pen.pos[3],
                (pen.pos[2] + pen.pos[0]) / 2,
                (pen.pos[3] + pen.pos[1]) / 2);
            ctx.stroke();
        } else if (click === 3) { // mouseup

        }
    }, roundOverlay);
    key("b", function() {
        app.selectTool(pen.penAPI ? "round-brush" : "round-brush-a");
    });

    function getSquareBrushPath(pos, r, p) {
        if (pos[0] > pos[2]) { // ->
            if (pos[1] > pos[3]) { // ^
                // x; y
                p[0] = pos[0] - r;  p[1] = pos[1] + r;
                p[2] = pos[0] + r;  p[3] = pos[1] + r;
                p[4] = pos[0] + r;  p[5] = pos[1] - r;
                p[6] = pos[2] + r;  p[7] = pos[3] - r;
                p[8] = pos[2] - r;  p[9] = pos[3] - r;
                p[10] = pos[2] - r; p[11] = pos[3] + r;
            } else { // v
                p[0] = pos[0] + r;  p[1] = pos[1] + r;
                p[2] = pos[0] + r;  p[3] = pos[1] - r;
                p[4] = pos[0] - r;  p[5] = pos[1] - r;
                p[6] = pos[2] - r;  p[7] = pos[3] - r;
                p[8] = pos[2] - r;  p[9] = pos[3] + r;
                p[10] = pos[2] + r; p[11] = pos[3] + r;
            }
        } else { // <-
            if (pos[1] > pos[3]) { // ^
                p[0] = pos[0] - r;  p[1] = pos[1] - r;
                p[2] = pos[0] - r;  p[3] = pos[1] + r;
                p[4] = pos[0] + r;  p[5] = pos[1] + r;
                p[6] = pos[2] + r;  p[7] = pos[3] + r;
                p[8] = pos[2] + r;  p[9] = pos[3] - r;
                p[10] = pos[2] - r; p[11] = pos[3] - r;
            } else { // v
                p[0] = pos[0] + r;  p[1] = pos[1] - r;
                p[2] = pos[0] - r;  p[3] = pos[1] - r;
                p[4] = pos[0] - r;  p[5] = pos[1] + r;
                p[6] = pos[2] - r;  p[7] = pos[3] + r;
                p[8] = pos[2] + r;  p[9] = pos[3] + r;
                p[10] = pos[2] + r; p[11] = pos[3] - r;
            }
        }
    }
    var path12 = Int32Array && new Int32Array(12) || new Array(12);
    app.createPenTool("sqpencil", "Square Brush", function(ctx, click) {
        var pen = app.pen;
        var r = pen.diameter / 2;

        ctx.fillStyle = pen.color;
        if (click === 1) { // mousedown
            ctx.fillRect(pen.pos[0] - r, pen.pos[1] - r, 2*r, 2*r);
        } else if (click === 2) { // mousemove
            var p = path12;
            getSquareBrushPath(pen.pos, r, p);
            ctx.lineCap = ctx.lineJoin = "round";
            ctx.beginPath();
            ctx.moveTo(p[0], p[1]);
            for (var i = 2; i < p.length; i+=2) {
                ctx.lineTo(p[i], p[i+1]);
            }
            ctx.closePath();
            ctx.fill();
        } else if (click === 3) { // mouseup

        }
    }, squareOverlay);

    app.createPenTool("eraser", "Eraser", function(ctx, click) {
        var pen = app.pen;

        ctx.globalCompositeOperation = "destination-out";
        if (click === 1) { // mousedown
            ctx.beginPath();
            ctx.arc(pen.pos[0], pen.pos[1], pen.diameter/2, 0, 2*Math.PI, false);
            ctx.fill();
        } else if (click === 2) { // mousemove
            ctx.lineWidth = pen.diameter;
            ctx.lineCap = ctx.lineJoin = "round";
            ctx.beginPath();
            ctx.moveTo(
                (pen.pos[2] + pen.pos[4]) / 2,
                (pen.pos[3] + pen.pos[5]) / 2);
            ctx.quadraticCurveTo(
                pen.pos[2],
                pen.pos[3],
                (pen.pos[2] + pen.pos[0]) / 2,
                (pen.pos[3] + pen.pos[1]) / 2);
            ctx.stroke();
        } else if (click === 3) { // mouseup

        }
        ctx.globalCompositeOperation = "source-over";
    }, roundOverlay, "e");

    var hexColorBuffer = ["#", "00","00","00"];
    app.createPenTool("eyedropper", "Eyedropper", function(ctx, click) {
        if (click === 3) return; // mouseup is unnecessary
        var i = 4 * (ctx.canvas.width * app.pen.pos[1] + app.pen.pos[0]);
        var data = ctx.getImageData(0, 0,
            ctx.canvas.width, ctx.canvas.height).data;
        hexColorBuffer[1] = data[i  ].toString(16);
        hexColorBuffer[2] = data[i+1].toString(16);
        hexColorBuffer[3] = data[i+2].toString(16);
        for (i = 1; i < 4; i++) {
            while (hexColorBuffer[i].length < 2)
                hexColorBuffer[i] = "0" + hexColorBuffer[i];
        }
        var colorPicker = $("#pen-color-picker");
        colorPicker.value = hexColorBuffer.join("");
        colorPicker.onchange();
    }, crosshair);

    app.createTool("offset-layer", "Offset Layer", function() {
        var layer = app.getActiveLayer();
        if (!layer) return;
        var xOff = +prompt("Enter x-offset amount (px)","") || 0;
        var yOff = -prompt("Enter y-offset amount (px)","") || 0;
        if (xOff !== 0 || yOff !== 0)
            var act = layer.pushNewAction({ type: "edit", dataPre: layer.canvas.toDataURL() });
            layer.offset(xOff, yOff);
            act.data = layer.canvas.toDataURL();
    });

    app.createTool("undo", "Undo", function() {
        var act = app.actions.done.pop();
        if (!act) return;

        switch (act.type) {

        case "edit":
            act.target.clear().loadURL(act.dataPre, act.target.updateFrameThumb);
            break;
        case "newlayer":
            act.target.remove();
            break;
        case "deletelayer":
            act.target
                .insert(act.nextTo).select().updateFrameThumb();
            break;
        case "mergedlayer":
            // undelete merged layer
            act.target.insert(act.target2).select().updateThumb();
            // Restore merging target
            act.target2.clear()
                .loadURL(act.data, act.target2.updateFrameThumb);
            break;
        case "pastelayer":
            act.target.remove();
            break;
        case "movelayerup":
            act.target.move(true);
            break;
        case "movelayerdown":
            act.target.move(false);
            break;
        case "newframe":
            act.target.remove();
            break;
        case "deleteframe":
            act.target.insert(act.nextTo).select();
            break;
        default:
            throw new Error("Unknown action type undone.");
        }

        app.actions.undone.push(act);
    }, "ctrl+z, command+z");

    app.createTool("redo", "Redo", function() {
        var act = app.actions.undone.pop();
        if (!act) return;

        switch (act.type) {

        case "edit":
            act.target.clear().loadURL(act.data, act.target.updateFrameThumb);
            break;
        case "newlayer":
            act.target.insert(act.nextTo).updateFrameThumb();
            break;
        case "deletelayer":
            act.target.remove();
            break;
        case "mergedlayer":
            act.target.merge(act.target2);
            break;
        case "pastelayer":
            act.target.insert(act.nextTo).updateFrameThumb();
            break;
        case "movelayerup":
            act.target.move(false);
            break;
        case "movelayerdown":
            act.target.move(true);
            break;
        case "newframe":
            act.target.insert(act.nextTo).select().updateThumb();
            break;
        case "deleteframe":
            act.target.remove();
            break;
        default:
            throw new Error("Unknown action type redone.");
        }

        app.actions.done.push(act);
    }, "ctrl+y, command+y");

    app.selectTool(pen.penAPI ? "round-brush" : "round-brush-a");
})();
