// requestAnimationFrame shim
if (!window.requestAnimationFrame) {
	window.requestAnimationFrame =
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame    ||
	window.oRequestAnimationFrame      ||
	window.msRequestAnimationFrame     ||
	function(callback) {
		return setTimeout(function() {
			callback(Date.now());
		}, 1000 / 60);
	};
}

// util
function getEl(s, a, p) {
	p = p || document;
	return p[a ? "querySelectorAll" : "querySelector"](s);
}
function makeEl(t, a, p) {
	var el = document.createElement(t);
	for (var i in a)
		el[i] = a[i];
	return p && p.appendChild ? p.appendChild(el) : el;
}

// spiiin
var spiiin = {};
/*
spiiin.updateVectorHead = function(v) {
	if (v.parent) {
		spiiin.updateVectorHead(v.parent);
		v.hx = v.parent.hx + v.x;
		v.hy = v.parent.hy + v.y;
	} else {
		v.hx = v.x;
		v.hy = v.y;
	}
};
*/
spiiin.updateVectorHeads = function(v) {
	var vectors = this.vectors, n = vectors.length;

	for (var i = 0; i < n; i++) {
		var v = vectors[i];
		if (v.parent) {
			v.hx = v.parent.hx + v.x;
			v.hy = v.parent.hy + v.y;
		} else {
			v.hx = v.x;
			v.hy = v.y;
		}
	}
};

spiiin.rotateVector = function(v, phi) {
    var
    c = Math.cos(phi),
    s = Math.sin(phi),
    x = v.x,
    y = v.y;
    
    v.x = x*c - y*s;
    v.y = x*s + y*c;
};

spiiin.circle = function(ctx, x, y, r, stroke) {
	ctx.beginPath();
	ctx.arc(x,y,r,0,6.2832,false);
	stroke ? ctx.stroke() : ctx.fill();
};

spiiin.load = function() {
	this.tcanvas.width = this.canvas.width = 1024;
	this.tcanvas.height = this.canvas.height = 768;
	this.tctx.strokeStyle = "#eee";
	this.tctx.lineWidth = 0.2;
	this.ctx.fillStyle = "#af3";
	this.ctx.strokeStyle = "brown";

	var
	vectors = this.vectors = [],
	valias = this.valias = {};

	function addVector(name,x,y,w,p) {
		var v = {x: x || 0, y: y || 0, hx: 0, hy: 0};
		if (typeof w === "number")
			v.w = w;
		if (typeof p === "string")
			v.parent = valias[p];
		else if (typeof p === "object")
			v.parent = p;
		vectors.push(v);
		valias[name] = v;
	}

	addVector("c1", 1024/2-100, 200);
	addVector("c2", 1024/2+100, 200);
	addVector("d1",  50, 0, 4, "c1");
	addVector("d2", -60, 0, -4.1, "c2");
	addVector("r1",  50, 0, -1, "d1");
	addVector("r2", -60, 0, 0.1, "d2");
	addVector("pen", 0, 0, null, "r1");
	valias.s1 = -2500;
	valias.s2 = -2700;
};

spiiin.update = function(dt) {
	var n = this.vectors.length;

	for (var i = 0; i < n; i++) {
		var v = this.vectors[i];
		if (v.w) this.rotateVector(v, v.w * dt);
	}
	
	this.updateVectorHeads();

	// get pen position
	var r0 = this.valias.s1, r1 = this.valias.s2;
	var p0 = this.valias.r1, p1 = this.valias.r2;
	var d2 = (p1.hx-p0.hx)*(p1.hx-p0.hx) + (p1.hy-p0.hy)*(p1.hy-p0.hy);
	var a = (r0*r0 - r1*r1 + d2) / (2 * Math.sqrt(d2));
	var phi = Math.atan2(p1.hy - p0.hy, p1.hx - p0.hx) + Math.acos(a / r0);
	var pen = this.valias.pen;
	pen.x = r0 * Math.cos(phi);
	pen.y = r0 * Math.sin(phi);
	// update pen vector head
	pen.hx = pen.parent.hx + pen.x;
	pen.hy = pen.parent.hy + pen.y;
};

spiiin.draw = function(ctx) {
	var cr = 5, n = this.vectors.length;

	ctx.clearRect(0,0,this.canvas.width,this.canvas.height);

	// draw constraints
	var v = this.valias.r1;
	ctx.moveTo(v.hx - v.x, v.hy - v.y);
	ctx.lineTo(v.hx, v.hy);
	v = this.valias.pen;
	ctx.lineTo(v.hx, v.hy);
	v = this.valias.r2;
	ctx.lineTo(v.hx, v.hy);
	ctx.lineTo(v.hx - v.x, v.hy - v.y);
	ctx.stroke();

	// draw joints
	for (var i = 0; i < n; i++) {
		v = this.vectors[i];
		this.circle(ctx, v.hx, v.hy, cr);
	}

	// draw pen trace
	var pen = this.valias.pen;
	this.circle(ctx, pen.hx, pen.hy, cr);

	// this.tctx.strokeRect(pen.hx-0.5, pen.hy-0.5,1,1);
    if (this.lastX) {
        this.tctx.beginPath();
        this.tctx.moveTo(this.lastX, this.lastY);
        this.tctx.lineTo(pen.hx, pen.hy);
        this.tctx.stroke();

        // this.tctx.beginPath();
        // this.tctx.moveTo(this.canvas.width - this.lastX, this.lastY);
        // this.tctx.lineTo(this.canvas.width - pen.hx, pen.hy);
        // this.tctx.stroke();
    }
    this.lastX = pen.hx;
    this.lastY = pen.hy;
};

spiiin.loop = function(time) {
	var s = spiiin;
	var dt = (time - s.lastTime) / 1000;

	s.update(dt);
	s.draw(s.ctx);

	s.lastTime = time;
	requestAnimationFrame(s.loop);
};

window.addEventListener("load", function() {
	var s = spiiin;
	s.canvas = makeEl("canvas", {id: "stage"}, getEl("#canvas-container"));
	s.ctx = s.canvas.getContext("2d");
	s.tcanvas = makeEl("canvas", {id: "trace"}, getEl("#canvas-container"));
	s.tctx = s.tcanvas.getContext("2d")
	s.load();
	s.lastTime = Date.now();
	requestAnimationFrame(s.loop);
}, false);

window.addEventListener("load", function() {
	var vs = spiiin.valias;

	new Dragdealer("r1-slider", {
		x: 0.5,
		slide: false,
		animationCallback: function(x) {
			var v = vs.r1;
			var r = Math.sqrt(v.x*v.x + v.y*v.y);
			var scale = 50 / r * 2*x;
			if (scale > 0) {
				v.x *= scale;
				v.y *= scale;
			}
		}
	});
	
	new Dragdealer("r2-slider", {
		x: 0.5,
		slide: false,
		animationCallback: function(x) {
			var v = vs.r2;
			var r = Math.sqrt(v.x*v.x + v.y*v.y);
			var scale = 60 / r * 2*x;
			if (scale > 0) {
				v.x *= scale;
				v.y *= scale;
			}
		}
	});
	
	new Dragdealer("s1-slider", {
		x: 0.5,
		slide: false,
		animationCallback: function(x) {
			var scale = 250 * 2*x;
			if (scale > 0)
				vs.s1 = scale;
		}
	});
	
	new Dragdealer("s2-slider", {
		x: 0.5,
		slide: false,
		animationCallback: function(x) {
			var scale = 270 * 2*x;
			if (scale > 0)
				vs.s2 = scale;
		}
	});
	
	getEl("#clear-trace-button").onclick = function() {
		spiiin.tctx.clearRect(0,0,spiiin.tcanvas.width,spiiin.tcanvas.height);
	};
}, false);
