(function() {

"use strict";

var N = 30;
var SIZE = (N + 2)*(N + 2);
function IX(x, y) { return (N+2)*y + x |0; }

var FloatArray = Float64Array;

var u = new FloatArray(SIZE);
var v = new FloatArray(SIZE);
var u0 = new FloatArray(SIZE);
var v0 = new FloatArray(SIZE);
var q = new FloatArray(SIZE);
var q0 = new FloatArray(SIZE);
var zeros = new FloatArray(SIZE);

var ctx = document.querySelector("#canvas").getContext("2d");
var CANVAS_SIZE = 600;
var CANVAS_SCALE = CANVAS_SIZE / N;
ctx.canvas.width = ctx.canvas.height = CANVAS_SIZE;
ctx.scale(CANVAS_SCALE,CANVAS_SCALE);
var fpsEl = document.querySelector("#fps");
var lastT = 0;
var userInput = {
  x: 0,
  y: 0,
  active: false,
};

function addSource(N, x, s, dt) {
    var len = ((N+2)*(N+2))|0;
    for (var i=0; i < len; i++) {
        x[i] += s[i] * dt;
    }
}

function diffuse(N, bnd, x, x0, rate, dt) {
    var a = N*N*rate*dt;
    var denom = 1/(1+4*a);

    for (var k=0; k<20; k++) {
        for (var j=1; j<=N; j++) {
            for (var i=1; i<=N; i++) {
                x[IX(i,j)] = (x0[IX(i,j)] + a * (
                        x[IX(i-1,j)] + x[IX(i+1,j)] +
                        x[IX(i,j-1)] + x[IX(i,j+1)])) * denom;
            }
        }
        setBound(N, bnd, x);
    }
}

function advect(N, bnd, x, x0, u, v, dt) {
    var dt0 = N*dt;

    for (var j=1; j<=N; j++) {
        for (var i=1; i<=N; i++) {
            var x = i - dt0 * u[IX(i,j)];
            var y = j - dt0 * v[IX(i,j)];
            if (x < 0.5) x = 0.5;
            else if (x > N+0.5) x = N + 0.5;
            if (y < 0.5) y = 0.5;
            else if (y > N+0.5) y = N + 0.5;
            var i0 = x|0, i1 = i0 + 1;
            var j0 = y|0, j1 = j0 + 1;
            var s1 = x - i0, s0 = 1 - s1;
            var t1 = y - j0, t0 = 1 - t1;
            x[IX(i,j)] = s0*(t0*x0[IX(i0,j0)] + t1*x0[IX(i0,j1)])
                         + s1*(t0*x0[IX(i1,j0)] + t1*x0[IX(i1,j1)]);
        }
    }
    setBound(N, bnd, x);
}

function project(N, u, v, p, div) {
    var h = 1/N;

    for (var j=1; j<=N; j++) {
        for (var i=1; i<=N; i++) {
            div[IX(i,j)] = -0.5*h*(u[IX(i+1,j)] - u[IX(i-1,j)] +
                                     v[IX(i,j+1)] - v[IX(i,j-1)]);
            p[IX(i,j)] = 0;
        }
    }
    setBound(N, 0, div);
    setBound(N, 0, p);

    for (var k=0; k<20; k++) {
        for (var j=1; j<=N; j++) {
            for (var i=1; i<=N; i++) {
                p[IX(i,j)] = 0.25*(div[IX(i,j)] +
                                     p[IX(i-1,j)] + p[IX(i+1,j)] +
                                     p[IX(i,j-1)] + p[IX(i,j+1)]);
            }
        }
        setBound(N, 0, p);
    }

    for (var j=1; j<=N; j++) {
        for (var i=1; i<=N; i++) {
            u[IX(i,j)] -= 0.5*N*(p[IX(i+1,j)] - p[IX(i-1,j)]);
            v[IX(i,j)] -= 0.5*N*(p[IX(i,j+1)] - p[IX(i,j-1)]);
        }
    }
    setBound(N, 1, u);
    setBound(N, 2, v);
}

function setBound(N, b, x) {
    for (var i=1; i<=N; i++) {
        x[IX(  0,  i)] = b==1 ? -x[IX(1,i)] : x[IX(1,i)];
        x[IX(N+1,  i)] = b==1 ? -x[IX(N,i)] : x[IX(N,i)];
        x[IX(  i,  0)] = b==2 ? -x[IX(i,1)] : x[IX(i,1)];
        x[IX(  i,N+1)] = b==2 ? -x[IX(i,N)] : x[IX(i,N)];
    }
    x[IX(  0,  0)] = 0.5*(x[IX(1,  0)] + x[IX(  0,1)]);
    x[IX(  0,N+1)] = 0.5*(x[IX(1,N+1)] + x[IX(  0,N)]);
    x[IX(N+1,  0)] = 0.5*(x[IX(N,  0)] + x[IX(N+1,1)]);
    x[IX(N+1,N+1)] = 0.5*(x[IX(N,N+1)] + x[IX(N+1,N)]);
}

function vStep(N, u, v, u0, v0, visc, dt) {
    var tmp;
    addSource(N, u, u0, dt);
    addSource(N, v, v0, dt);
    tmp=u; u=u0; u0=tmp;
    tmp=v; v=v0; v0=tmp;
    diffuse(N, 1, u, u0, visc, dt);
    diffuse(N, 2, v, v0, visc, dt);
    project(N, u, v, u0, v0);
    tmp=u; u=u0; u0=tmp;
    tmp=v; v=v0; v0=tmp;
    advect(N, 1, u, u0, u0, v0, dt);
    advect(N, 2, v, v0, u0, v0, dt);
    project(N, u, v, u0, v0);
}

function qStep(N, x, x0, u, v, kDiff, dt) {
    var tmp;
    addSource(N, x, x0, dt);
    tmp=x; x=x0; x0=tmp;
    diffuse(N, 0, x, x0, kDiff, dt);
    tmp=x; x=x0; x0=tmp;
    advect(N, 0, x, x0, u, v, dt);
}

function qDraw(N, ctx, x, scale) {
    // ctx.clearRect(0,0,N,N);
    // for (var j=0; j<N; j++) {
    //     for (var i=0; i<N; i++) {
    //         var val = Math.min(scale * x[IX(i+1, j+1)], 1).toFixed(3);
    //         ctx.fillStyle = "rgba(150,200,0," + val + ")";
    //         ctx.fillRect(i, j, 1, 1);
    //     }
    // }
    var imgData = ctx.getImageData(0,0,N,N);
    for (var j=0; j<N; j++) {
      for (var i=0; i<N; i++) {
        var ind = 4*(j*N + i);
        var qInd = IX(i+1,j+1);
        imgData.data[ind  ] = 150;
        imgData.data[ind+1] = 200;
        imgData.data[ind+2] = 0;
        imgData.data[ind+3] = scale*x[qInd];
      }
    }
    ctx.putImageData(imgData,0,0);
}

function setFields(q0, u0, v0) {
  q0.set(zeros);
  u0.set(zeros);
  v0.set(zeros);

  if (userInput.active) {
    var x = userInput.x, y = userInput.y;
    q0[IX(x,y)] = 10;
    u0[IX(x,y)] = 10;
  }
}

function tick(t) {
    var dt = 0.001*(t - lastT);
    lastT = t;

    setFields(q0, u0, v0);
    vStep(N, u, v, u0, v0, 1e-5, dt);
    qStep(N, q, q0, u, v, 1e-4, dt);
    qDraw(N, ctx, q, 100);

    fpsEl.textContent = (dt).toFixed(2);
    requestAnimationFrame(tick);
}

requestAnimationFrame(function(t) {
    lastT = t;
    requestAnimationFrame(tick);
});

function getInputXY(e) {
  if (userInput.active) {
    userInput.x = (e.layerX / CANVAS_SCALE |0) + 1;
    userInput.y = (e.layerY / CANVAS_SCALE |0) + 1;
  }
}
ctx.canvas.addEventListener("mousedown", function(e) {
  userInput.active = true;
  getInputXY(e);
})
ctx.canvas.addEventListener("mousemove", getInputXY);
window.addEventListener("mouseup", function(e) {
  userInput.active = false;
})

})();
