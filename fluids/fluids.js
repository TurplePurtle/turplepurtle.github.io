(function() {

"use strict";

var N = 30;
var size = (N + 2)*(N + 2);
function xy2i(x, y) { return (32*y + x)|0; }

var u = new Float64Array(size);
var v = new Float64Array(size);
var u0 = new Float64Array(size);
var v0 = new Float64Array(size);
var q = new Float64Array(size);
var q0 = new Float64Array(size);

var fpsEl = document.querySelector("#fps");
var ctx = document.querySelector("#canvas").getContext("2d");
ctx.canvas.width = 600;
ctx.canvas.height = 600;
ctx.transform(ctx.canvas.width/N,0,0,-ctx.canvas.height/N,0,ctx.canvas.height);
var lastT = 0;

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
                x[xy2i(i,j)] = (x0[xy2i(i,j)] + a * (
                        x[xy2i(i-1,j)] + x[xy2i(i+1,j)] +
                        x[xy2i(i,j-1)] + x[xy2i(i,j+1)])) * denom;
            }
        }
        setBound(N, bnd, x);
    }
}

function advect(N, bnd, x, x0, u, v, dt) {
    var dt0 = N*dt;

    for (var j=1; j<=N; j++) {
        for (var i=1; i<=N; i++) {
            var x = i - dt0 * u[xy2i(i,j)];
            var y = j - dt0 * v[xy2i(i,j)];
            if (x < 0.5) x = 0.5;
            else if (x > N+0.5) x = N + 0.5;
            if (y < 0.5) y = 0.5;
            else if (y > N+0.5) y = N + 0.5;
            var i0 = x|0, i1 = i0 + 1;
            var j0 = y|0, j1 = j0 + 1;
            var s1 = x - i0, s0 = 1 - s1;
            var t1 = y - j0, t0 = 1 - t1;
            x[xy2i(i,j)] = s0*(t0*x0[xy2i(i0,j0)] + t1*x0[xy2i(i0,j1)])
                         + s1*(t0*x0[xy2i(i1,j0)] + t1*x0[xy2i(i1,j1)]);
        }
    }
    setBound(N, bnd, x);
}

function project(N, u, v, p, div) {
    var h = 1/N;
    
    for (var j=1; j<=N; j++) {
        for (var i=1; i<=N; i++) {
            div[xy2i(i,j)] = -0.5*h*(u[xy2i(i+1,j)] - u[xy2i(i-1,j)] +
                                     v[xy2i(i,j+1)] - v[xy2i(i,j-1)]);
            p[xy2i(i,j)] = 0;
        }
    }
    setBound(N, 0, div);
    setBound(N, 0, p);
    
    for (var k=0; k<20; k++) {
        for (var j=1; j<=N; j++) {
            for (var i=1; i<=N; i++) {
                p[xy2i(i,j)] = 0.25*(div[xy2i(i,j)] +
                                     p[xy2i(i-1,j)] + p[xy2i(i+1,j)] +
                                     p[xy2i(i,j-1)] + p[xy2i(i,j+1)]);
            }
        }
        setBound(N, 0, p);
    }
    
    for (var j=1; j<=N; j++) {
        for (var i=1; i<=N; i++) {
            u[xy2i(i,j)] -= 0.5*N*(p[xy2i(i+1,j)] - p[xy2i(i-1,j)]);
            v[xy2i(i,j)] -= 0.5*N*(p[xy2i(i,j+1)] - p[xy2i(i,j-1)]);
        }
    }
    setBound(N, 1, u);
    setBound(N, 2, v);
}

function setBound(N, b, x) {
    for (var i=1; i<=N; i++) {
        x[xy2i(  0,  i)] = b==1 ? -x[xy2i(1,i)] : x[xy2i(1,i)];
        x[xy2i(N+1,  i)] = b==1 ? -x[xy2i(N,i)] : x[xy2i(N,i)];
        x[xy2i(  i,  0)] = b==2 ? -x[xy2i(i,1)] : x[xy2i(i,1)];
        x[xy2i(  i,N+1)] = b==2 ? -x[xy2i(i,N)] : x[xy2i(i,N)];
    }
    x[xy2i(  0,  0)] = 0.5*(x[xy2i(1,  0)] + x[xy2i(  0,1)]);
    x[xy2i(  0,N+1)] = 0.5*(x[xy2i(1,N+1)] + x[xy2i(  0,N)]);
    x[xy2i(N+1,  0)] = 0.5*(x[xy2i(N,  0)] + x[xy2i(N+1,1)]);
    x[xy2i(N+1,N+1)] = 0.5*(x[xy2i(N,N+1)] + x[xy2i(N+1,N)]);
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
    ctx.clearRect(0,0,N,N);
    for (var j=0; j<N; j++) {
        for (var i=0; i<N; i++) {
            var val = Math.min(scale * x[xy2i(i+1, j+1)], 1).toFixed(3);
            ctx.fillStyle = "rgba(150,200,0," + val + ")";
            ctx.fillRect(i, j, 1, 1);
        }
    }
}

    // v0[xy2i(3,4)] = 3;

function tick(t) {
    var dt = 0.001*(t - lastT);
    lastT = t;

    // for (var i=0; i<size; i++)
        // q0[i] = 0;
    q0[xy2i(3,3)] = 1;
        
    // for (var i=0; i<size; i++)
        // u0[i] = 0;
    u0[xy2i(3,4)] += 30;
    // for (var i=0; i<size; i++)
        // v0[i] = 0;

    vStep(N, u, v, u0, v0, 1e-5, dt);
    qStep(N, q, q0, u, v, 1e-4, dt);
    qDraw(N, ctx, u, 100);

    fpsEl.textContent = (1/dt).toFixed(2);
    requestAnimationFrame(tick);
}

requestAnimationFrame(function(t) {
    lastT = t;
    requestAnimationFrame(tick);
});

})();
