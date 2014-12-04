(function() {

"use strict";

var sim;

function clamp(val,min,max) { return Math.min(Math.max(val,min),max); }
function xy2i(x, y) { return sim.N*y + x; }

var sim = {
    N: 1,
    size: 1,
    FloatArray: Float64Array,
    u: null,
    v: null,
    u0: null,
    v0: null,
    q: null,
    q0: null,
    bnd: null,
    zeros: null,
    viscosity: 1e-2,
    diffusion: 1e-3,
    num_iter: 10,
    canvas: null,
    ctx: null,
    animationFrameId: 0,
    fpsEl: null,
    fps: 0,
    lastT: 0,
    userInput: {
        x: 0,
        y: 0,
        i: 0,
        j: 0,
        u: 0,
        v: 0,
        active: false,
        type: 0,
    }
};

sim.resetBoundary = function() {
    var bnd = sim.bnd;
    bnd.set(sim.zeros);
    var N = sim.N;
    for (var i=0; i<N; i++) {
        bnd[xy2i(i,0)] = bnd[xy2i(i,N-1)] = bnd[xy2i(0,i)] = bnd[xy2i(N-1,i)] = 1;
    }
}

sim.addSource = function(q, q0, dt) {
    for (var i=0; i < q.length; i++) {
        q[i] += q0[i] * dt;
    }
}

sim.diffuse = function(N, bnd, q, q0, rate, dt) {
    var a = q.length*rate*dt;
    var denom = 1/(1+4*a);

    for (var k=0; k<sim.num_iter; k++) {
        for (var j=1; j<N-1; j++) {
            for (var i=1; i<N-1; i++) {
                q[xy2i(i,j)] = denom*(q0[xy2i(i,j)] +
                             a*(q[xy2i(i-1,j)] + q[xy2i(i+1,j)] +
                                q[xy2i(i,j-1)] + q[xy2i(i,j+1)]));
            }
        }
        setBound(N, bnd, q);
    }
}

sim.advect = function(N, bnd, q, q0, u, v, dt) {
    for (var j=1; j<N-1; j++) {
        for (var i=1; i<N-1; i++) {
            var ind = xy2i(i,j);
            var x = i - dt*N * u[ind];
            var y = j - dt*N * v[ind];
            x = clamp(x,0,N-1.001);
            y = clamp(y,0,N-1.001);
            var i0 = x|0, i1 = i0 + 1;
            var j0 = y|0, j1 = j0 + 1;
            q[ind] = q0[xy2i(i0,j0)]*(i1-x)*(j1-y)
                   + q0[xy2i(i1,j0)]*(x-i0)*(j1-y)
                   + q0[xy2i(i0,j1)]*(i1-x)*(y-j0)
                   + q0[xy2i(i1,j1)]*(x-i0)*(y-j0);
        }
    }
    setBound(N, bnd, x);
}

sim.project = function(N, u, v, p, div) {
    var h = 1/N;

    for (var j=1; j<N-1; j++) {
        for (var i=1; i<N-1; i++) {
            div[xy2i(i,j)] = -0.5*h*(u[xy2i(i+1,j)] - u[xy2i(i-1,j)] +
                                     v[xy2i(i,j+1)] - v[xy2i(i,j-1)]);
            p[xy2i(i,j)] = 0;
        }
    }
    setBound(N, 0, div);
    setBound(N, 0, p);

    for (var k=0; k<sim.num_iter; k++) {
        for (var j=1; j<N-1; j++) {
            for (var i=1; i<N-1; i++) {
                p[xy2i(i,j)] = 0.25*(div[xy2i(i,j)] +
                p[xy2i(i-1,j)] + p[xy2i(i+1,j)] +
                p[xy2i(i,j-1)] + p[xy2i(i,j+1)]);
            }
        }
        setBound(N, 0, p);
    }

    for (var j=1; j<N-1; j++) {
        for (var i=1; i<N-1; i++) {
            u[xy2i(i,j)] -= 0.5*N*(p[xy2i(i+1,j)] - p[xy2i(i-1,j)]);
            v[xy2i(i,j)] -= 0.5*N*(p[xy2i(i,j+1)] - p[xy2i(i,j-1)]);
        }
    }
    setBound(N, 1, u);
    setBound(N, 2, v);
}

function setBound(N, b, x) {
    // for (var i=1; i<=N; i++) {
    //     x[xy2i(  0,  i)] = b==1 ? -x[xy2i(1,i)] : x[xy2i(1,i)];
    //     x[xy2i(N+1,  i)] = b==1 ? -x[xy2i(N,i)] : x[xy2i(N,i)];
    //     x[xy2i(  i,  0)] = b==2 ? -x[xy2i(i,1)] : x[xy2i(i,1)];
    //     x[xy2i(  i,N+1)] = b==2 ? -x[xy2i(i,N)] : x[xy2i(i,N)];
    // }
    // x[xy2i(  0,  0)] = 0.5*(x[xy2i(1,  0)] + x[xy2i(  0,1)]);
    // x[xy2i(  0,N+1)] = 0.5*(x[xy2i(1,N+1)] + x[xy2i(  0,N)]);
    // x[xy2i(N+1,  0)] = 0.5*(x[xy2i(N,  0)] + x[xy2i(N+1,1)]);
    // x[xy2i(N+1,N+1)] = 0.5*(x[xy2i(N,N+1)] + x[xy2i(N+1,N)]);

    for (var i=0; i<x.length; i++) {
        if (sim.bnd[i] > 0) {
            x[i] = 0;
        }
    }
    // for (var i=0; i<N+2; i++) {
    //     x[xy2i(  0,  i)] = 0;
    //     x[xy2i(N+1,  i)] = 0;
    //     x[xy2i(  i,  0)] = 0;
    //     x[xy2i(  i,N+1)] = 0;
    // }
}

sim.vStep = function(u, v, u0, v0, visc, dt) {
    var tmp;
    sim.addSource(u, u0, dt);
    sim.addSource(v, v0, dt);
    tmp=u; u=u0; u0=tmp;
    tmp=v; v=v0; v0=tmp;
    sim.diffuse(sim.N, 1, u, u0, visc, dt);
    sim.diffuse(sim.N, 2, v, v0, visc, dt);
    sim.project(sim.N, u, v, u0, v0);
    tmp=u; u=u0; u0=tmp;
    tmp=v; v=v0; v0=tmp;
    sim.advect(sim.N, 1, u, u0, u0, v0, dt);
    sim.advect(sim.N, 2, v, v0, u0, v0, dt);
    sim.project(sim.N, u, v, u0, v0);
}

sim.qStep = function(x2, x1, u, v, kDiff, dt) {
    var tmp;
    sim.addSource(x2, x1, dt);
    sim.diffuse(sim.N, 0, x1, x2, kDiff, dt);
    sim.advect(sim.N, 0, x2, x1, u, v, dt);
}

sim.qDraw = function(ctx, q, scale) {
    var N = sim.N;
    var imgData = ctx.getImageData(0,0,N,N);
    var kr = scale*1.0;
    var kg = scale*0.0;
    var kb = scale*0.5;
    for (var j=0; j<N; j++) {
        for (var i=0; i<N; i++) {
            var ind = 4*(j*N + i);
            var qInd = xy2i(i,j);
            if (sim.bnd[qInd] > 0) {
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

sim.setFields = function(q0, u0, v0) {
    q0.set(sim.zeros);
    u0.set(sim.zeros);
    v0.set(sim.zeros);

    var userInput = sim.userInput;
    if (userInput.active) {
        var ind = xy2i(userInput.i, userInput.j);

        switch (userInput.type) {
        case 0:
            q0[ind] = 10*sim.N;
            u0[ind] = userInput.u;
            v0[ind] = userInput.v;
            break;
        case 1:
            sim.bnd[ind] = 1;
            break;
        }
    }
}

sim.tick = function(t) {
    var dt = 0.001*(t - sim.lastT);
    sim.lastT = t;

    sim.setFields(sim.q0, sim.u0, sim.v0);
    sim.vStep(sim.u, sim.v, sim.u0, sim.v0, sim.viscosity, dt);
    sim.qStep(sim.q, sim.q0, sim.u, sim.v, sim.diffusion, dt);
    sim.qDraw(sim.ctx, sim.q, 100);

    sim.fps = 0.02/dt + 0.98*sim.fps;
    sim.fpsEl.textContent = sim.fps |0;
    sim.animationFrameId = requestAnimationFrame(sim.tick);
}

sim.run = function() {
    sim.pause();
    sim.animationFrameId = requestAnimationFrame(function(t) {
        sim.lastT = t;
        sim.animationFrameId = requestAnimationFrame(sim.tick);
    });
}

sim.pause = function() {
    cancelAnimationFrame(sim.animationFrameId);
}

sim.setup = function() {
    sim.N = 64;
    sim.size = sim.N*sim.N;

    ["u","u0","v","v0","q","q0","zeros"].forEach(function(field) {
        sim[field] = new sim.FloatArray(sim.size);
    })
    sim.bnd = new Int8Array(sim.size);
    sim.canvas = document.querySelector("#canvas");
    sim.ctx = sim.canvas.getContext("2d",{alpha:false});
    sim.canvas.width = sim.canvas.height = sim.N;
    sim.fpsEl = document.querySelector("#fps");
    sim.resetBoundary();

    function switchInputType(t) {
        sim.userInput.type = t;
    }

    function getInputXY(e) {
        var x = e.layerX;
        var y = e.layerY;
        var userInput = sim.userInput;
        userInput.u = 40*(x - userInput.x);
        userInput.v = 40*(y - userInput.y);
        userInput.x = x;
        userInput.y = y;
        userInput.i = clamp((x*sim.N/e.target.offsetWidth |0) + 1, 1, sim.N);
        userInput.j = clamp((y*sim.N/e.target.offsetHeight |0) + 1 ,1, sim.N);
    }
    sim.canvas.addEventListener("mousedown", function(e) {
        sim.userInput.active = true;
        getInputXY(e);
    })
    sim.canvas.addEventListener("mousemove", function(e) {
        getInputXY(e);
    });
    sim.canvas.addEventListener("mouseout", function(e) {
        sim.userInput.u = sim.userInput.v = 0;
    })
    window.addEventListener("mouseup", function(e) {
        sim.userInput.active = false;
    })
    document.querySelector("#color-button").addEventListener("click", function(e) {
        switchInputType(0);
    });
    document.querySelector("#wall-button").addEventListener("click", function(e) {
        switchInputType(1);
    });
    document.querySelector("#wall-clear-button").addEventListener("click", sim.resetBoundary);
    document.querySelector("#run-button").addEventListener("click", sim.run);
    document.querySelector("#pause-button").addEventListener("click", sim.pause);
    sim.run();
}

sim.setup();

})();
