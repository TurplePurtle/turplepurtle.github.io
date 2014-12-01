(function() {

"use strict";

var N = 62;
var SIZE = (N + 2)*(N + 2);
function IX(x, y) { return (N+2)*y + x |0; }
function clamp(val,min,max) { return Math.min(Math.max(val,min),max); }

var FloatArray = Float64Array;

var u = new FloatArray(SIZE);
var v = new FloatArray(SIZE);
var u0 = new FloatArray(SIZE);
var v0 = new FloatArray(SIZE);
var q = new FloatArray(SIZE);
var q0 = new FloatArray(SIZE);
var bnd = new Int8Array(SIZE);
var zeros = new FloatArray(SIZE);

var num_iter = 10;

var ctx = document.querySelector("#canvas").getContext("2d",{alpha:false});
ctx.canvas.width = ctx.canvas.height = N;
var fpsEl = document.querySelector("#fps");
var fps = 0;
var lastT = 0;
var userInput = {
    x: 0,
    y: 0,
    i: 0,
    j: 0,
    u: 0,
    v: 0,
    active: false,
    type: 0,
};

function resetBoundary() {
    bnd.set(zeros);
    for (var i=0; i<N+2; i++) {
        bnd[IX(i,0)] = bnd[IX(i,N+1)] = bnd[IX(0,i)] = bnd[IX(N+1,i)] = 1;
    }
}

function addSource(N, q, q0, dt) {
    var len = ((N+2)*(N+2))|0;
    for (var i=0; i < len; i++) {
        q[i] += q0[i] * dt;
    }
}

function diffuse(N, bnd, q, q0, rate, dt) {
    var a = N*N*rate*dt;
    var denom = 1/(1+4*a);

    for (var k=0; k<num_iter; k++) {
        for (var j=1; j<=N; j++) {
            for (var i=1; i<=N; i++) {
                q[IX(i,j)] = denom*(q0[IX(i,j)] +
                             a*(q[IX(i-1,j)] + q[IX(i+1,j)] +
                                q[IX(i,j-1)] + q[IX(i,j+1)]));
            }
        }
        setBound(N, bnd, q);
    }
}

function advect(N, bnd, q, q0, u, v, dt) {
    for (var j=1; j<=N; j++) {
        for (var i=1; i<=N; i++) {
            var ind = IX(i,j);
            var x = i - dt*N * u[ind];
            var y = j - dt*N * v[ind];
            x = clamp(x,0,N+0.99);
            y = clamp(y,0,N+0.99);
            var i0 = x|0, i1 = i0 + 1;
            var j0 = y|0, j1 = j0 + 1;
            q[ind] = q0[IX(i0,j0)]*(i1-x)*(j1-y)
                   + q0[IX(i1,j0)]*(x-i0)*(j1-y)
                   + q0[IX(i0,j1)]*(i1-x)*(y-j0)
                   + q0[IX(i1,j1)]*(x-i0)*(y-j0);
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

    for (var k=0; k<num_iter; k++) {
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
    // for (var i=1; i<=N; i++) {
    //     x[IX(  0,  i)] = b==1 ? -x[IX(1,i)] : x[IX(1,i)];
    //     x[IX(N+1,  i)] = b==1 ? -x[IX(N,i)] : x[IX(N,i)];
    //     x[IX(  i,  0)] = b==2 ? -x[IX(i,1)] : x[IX(i,1)];
    //     x[IX(  i,N+1)] = b==2 ? -x[IX(i,N)] : x[IX(i,N)];
    // }
    // x[IX(  0,  0)] = 0.5*(x[IX(1,  0)] + x[IX(  0,1)]);
    // x[IX(  0,N+1)] = 0.5*(x[IX(1,N+1)] + x[IX(  0,N)]);
    // x[IX(N+1,  0)] = 0.5*(x[IX(N,  0)] + x[IX(N+1,1)]);
    // x[IX(N+1,N+1)] = 0.5*(x[IX(N,N+1)] + x[IX(N+1,N)]);

    for (var i=0; i<x.length; i++) {
        if (bnd[i] > 0) {
            x[i] = 0;
        }
    }
    // for (var i=0; i<N+2; i++) {
    //     x[IX(  0,  i)] = 0;
    //     x[IX(N+1,  i)] = 0;
    //     x[IX(  i,  0)] = 0;
    //     x[IX(  i,N+1)] = 0;
    // }
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
    diffuse(N, 0, x0, x, kDiff, dt);
    advect(N, 0, x, x0, u, v, dt);
}

function qDraw(N, ctx, q, scale) {
    var imgData = ctx.getImageData(0,0,N,N);
    var kr = scale*1.0;
    var kg = scale*0.0;
    var kb = scale*0.5;
    for (var j=0; j<N; j++) {
        for (var i=0; i<N; i++) {
            var ind = 4*(j*N + i);
            var qInd = IX(i+1,j+1);
            if (bnd[qInd] > 0) {
                imgData.data[ind  ] = 255;
                imgData.data[ind+1] = 255;
                imgData.data[ind+2] = 255;
                imgData.data[ind+3] = 255;
            } else {
                imgData.data[ind  ] = kr * q[qInd];
                imgData.data[ind+1] = kg * q[qInd];
                imgData.data[ind+2] = kb * q[qInd];
                imgData.data[ind+3] = 255;
            }
        }
    }
    ctx.putImageData(imgData,0,0);
}

function setFields(q0, u0, v0) {
    q0.set(zeros);
    u0.set(zeros);
    v0.set(zeros);

    if (userInput.active) {
        var ind = IX(userInput.i, userInput.j);

        switch (userInput.type) {
        case 0:
            q0[ind] = 10*N;
            u0[ind] = userInput.u;
            v0[ind] = userInput.v;
            break;
        case 1:
            bnd[ind] = 1;
            break;
        }
    }
}

function tick(t) {
    var dt = 0.001*(t - lastT);
    lastT = t;

    setFields(q0, u0, v0);
    vStep(N, u, v, u0, v0, 1e-4, dt);
    qStep(N, q, q0, u, v, 1e-4, dt);
    qDraw(N, ctx, q, 100);

    fps = 0.02/dt + 0.98*fps;
    fpsEl.textContent = fps.toFixed(1);
    requestAnimationFrame(tick);
}

requestAnimationFrame(function(t) {
    lastT = t;
    requestAnimationFrame(tick);
});

function switchInputType(t) {
    userInput.type = t;
}

function getInputXY(e) {
    var x = e.layerX;
    var y = e.layerY;
    userInput.u = 40*(x - userInput.x);
    userInput.v = 40*(x - userInput.x);
    userInput.x = x;
    userInput.y = y;
    userInput.i = clamp((x*N/ctx.canvas.offsetWidth |0) + 1, 1, N);
    userInput.j = clamp((y*N/ctx.canvas.offsetHeight |0) + 1 ,1, N);
}
ctx.canvas.addEventListener("mousedown", function(e) {
    userInput.active = true;
    getInputXY(e);
})
ctx.canvas.addEventListener("mousemove", function(e) {
    getInputXY(e);
});
ctx.canvas.addEventListener("mouseout", function(e) {
    userInput.u = userInput.v = 0;
})
window.addEventListener("mouseup", function(e) {
    userInput.active = false;
})
document.querySelector("#substance-button").addEventListener("click", function(e) {
    switchInputType(0);
});
document.querySelector("#wall-button").addEventListener("click", function(e) {
    switchInputType(1);
});
document.querySelector("#wall-clear-button").addEventListener("click", function(e) {
    resetBoundary();
});

})();
