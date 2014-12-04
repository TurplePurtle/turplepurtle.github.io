(function(exports) {

"use strict";

var sim;

function clamp(val,min,max) { return Math.min(Math.max(val,min),max); }
function xy2i(x, y) { return sim.N*y + x; }

var sim = {
    N: 1,
    size: 1,
    u0: null,
    u1: null,
    ubnd: null,
    v0: null,
    v1: null,
    vbnd: null,
    q0: null,
    q1: null,
    qbnd: null,
    zeros: null,
    viscosity: 1e-3,
    diffusion: 1e-3,
    numIter: 10,
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
    },
    forces: [],
    forceXEl: null,
    forceYEl: null,
    bndType: 0,
};

sim.resetBoundaries = function() {
    var N = sim.N;

    for (var i=0; i<sim.ubnd.length; i++) {
        sim.ubnd[i] = -1;
        sim.vbnd[i] = -1;
        sim.qbnd[i] = -1;
    }

    switch (sim.bndType) {
    case 1:
        for (var i=0; i<N; i++) {
            sim.vbnd[xy2i(i,  0)] = 0;  // top
            sim.vbnd[xy2i(i,N-1)] = 0;  // bottom
            sim.ubnd[xy2i(  0,i)] = 6;  // left
            sim.ubnd[xy2i(N-1,i)] = 4;  // right
            sim.qbnd[xy2i(i,  0)] = 2;  // top
            sim.qbnd[xy2i(i,N-1)] = 8;  // bottom
            sim.qbnd[xy2i(  0,i)] = 6;  // left
            sim.qbnd[xy2i(N-1,i)] = 4;  // right
        }
        break;
    case 0:
    default:
        for (var i=0; i<N; i++) {
            sim.vbnd[xy2i(i,  0)] = 0;  // top
            sim.vbnd[xy2i(i,N-1)] = 0;  // bottom
            sim.ubnd[xy2i(  0,i)] = 0;  // left
            sim.ubnd[xy2i(N-1,i)] = 0;  // right
            sim.qbnd[xy2i(i,  0)] = 2;  // top
            sim.qbnd[xy2i(i,N-1)] = 8;  // bottom
            sim.qbnd[xy2i(  0,i)] = 6;  // left
            sim.qbnd[xy2i(N-1,i)] = 4;  // right
        }
    }
};

sim.gaussSeidelLaplacian = function(q1, q0, qbnd, k, a, numIter) {
    var kinv = 1/k;
    var N = sim.N;

    for (var k=0; k<numIter; k++) {
        for (var j=1; j<N-1; j++) {
            for (var i=1; i<N-1; i++) {
                q1[xy2i(i,j)] = kinv*(q0[xy2i(i,j)] +
                                   a*(q1[xy2i(i-1,j)] + q1[xy2i(i+1,j)] +
                                      q1[xy2i(i,j-1)] + q1[xy2i(i,j+1)]));
            }
        }
        sim.setBound(q1, qbnd);
    }
};

sim.addSource = function(q1, q0, dt) {
    for (var i=0; i < q1.length; i++) {
        q1[i] += q0[i] * dt;
    }
};

sim.diffuse = function(q1, q0, qbnd, rate, dt) {
    var a = q1.length*rate*dt;
    sim.gaussSeidelLaplacian(q1, q0, qbnd, 4*a + 1, a, sim.numIter);
};

sim.advect = function(q1, q0, u, v, qbnd, dt) {
    var N = sim.N;

    for (var j=1; j<N-1; j++) {
        for (var i=1; i<N-1; i++) {
            var ind = xy2i(i,j);
            var x = i - dt*N * u[ind];
            var y = j - dt*N * v[ind];
            x = clamp(x,0.5,N-1.5);
            y = clamp(y,0.5,N-1.5);
            var i0 = x|0, i1 = i0 + 1;
            var j0 = y|0, j1 = j0 + 1;
            q1[ind] = q0[xy2i(i0,j0)]*(i1-x)*(j1-y)
                    + q0[xy2i(i1,j0)]*(x-i0)*(j1-y)
                    + q0[xy2i(i0,j1)]*(i1-x)*(y-j0)
                    + q0[xy2i(i1,j1)]*(x-i0)*(y-j0);
        }
    }
    sim.setBound(q1, qbnd);
};

sim.project = function(u, v, p, div) {
    var N = sim.N;
    var h = 1/N;

    p.set(sim.zeros);

    // Get divergence of u
    for (var j=1; j<N-1; j++) {
        for (var i=1; i<N-1; i++) {
            div[xy2i(i,j)] = -0.5*h*(u[xy2i(i+1,j)] - u[xy2i(i-1,j)] +
                                     v[xy2i(i,j+1)] - v[xy2i(i,j-1)]);
        }
    }
    sim.setBound(div, sim.qbnd);

    // Solve for p
    sim.gaussSeidelLaplacian(p, div, sim.qbnd, 4, 1, sim.numIter);

    // Subtract grad(p)
    for (var j=1; j<N-1; j++) {
        for (var i=1; i<N-1; i++) {
            u[xy2i(i,j)] -= 0.5/h*(p[xy2i(i+1,j)] - p[xy2i(i-1,j)]);
            v[xy2i(i,j)] -= 0.5/h*(p[xy2i(i,j+1)] - p[xy2i(i,j-1)]);
        }
    }

    sim.setBound(u,sim.ubnd);
    sim.setBound(v,sim.vbnd);
};

sim.setBound = function(q, qbnd) {
    var N = sim.N;

    for (var i=0; i<q.length; i++) {
        switch (qbnd[i]) {
        case 0:  // zero
            q[i] = 0;
            break;
        case 2:  // top side
            q[i] = q[i+N];
            break;
        case 4:  // right side
            q[i] = q[i-1];
            break;
        case 6:  // left side
            q[i] = q[i+1];
            break;
        case 8:  // bottom side
            q[i] = q[i-N];
            break;
        }
    }
};

sim.vStep = function(u1, v1, u0, v0, ubnd, vbnd, visc, dt) {
    sim.addSource(u1, u0, dt);
    sim.addSource(v1, v0, dt);
    sim.diffuse(u0, u1, ubnd, visc, dt);
    sim.diffuse(v0, v1, vbnd, visc, dt);
    sim.project(u0, v0, u1, v1, ubnd, vbnd);
    sim.advect(u1, u0, u0, v0, ubnd, dt);
    sim.advect(v1, v0, u0, v0, vbnd, dt);
    sim.project(u1, v1, u0, v0, ubnd, vbnd);
};

sim.qStep = function(q1, q0, u, v, qbnd, kDiff, dt) {
    sim.addSource(q1, q0, dt);
    sim.diffuse(q0, q1, qbnd, kDiff, dt);
    sim.advect(q1, q0, u, v, qbnd, dt);
};

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
            if (sim.qbnd[qInd] >= 0) {
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
};

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
            sim.ubnd[ind] = 0;
            sim.vbnd[ind] = 0;
            sim.qbnd[ind] = 0;
            break;
        case 2:
            sim.forces.push([ind,
                             sim.N*(sim.forceXEl.value||0),
                             sim.N*(sim.forceYEl.value||0)]);
        }
    }

    for (var i=0; i<sim.forces.length; i++) {
        var force = sim.forces[i];
        u0[force[0]] = force[1];
        v0[force[0]] = force[2];
    }
};

sim.tick = function(t) {
    var dt = 0.001*(t - sim.lastT);
    sim.lastT = t;

    sim.setFields(sim.q0, sim.u0, sim.v0);
    sim.vStep(sim.u1, sim.v1, sim.u0, sim.v0, sim.ubnd, sim.vbnd, sim.viscosity, dt);
    sim.qStep(sim.q1, sim.q0, sim.u1, sim.v1, sim.qbnd, sim.diffusion, dt);
    sim.qDraw(sim.ctx, sim.q1, 100);

    sim.fps = 0.02/dt + 0.98*sim.fps;
    sim.fpsEl.textContent = sim.fps |0;
    sim.animationFrameId = requestAnimationFrame(sim.tick);
};

sim.run = function() {
    sim.pause();
    sim.animationFrameId = requestAnimationFrame(function(t) {
        sim.lastT = t;
        sim.animationFrameId = requestAnimationFrame(sim.tick);
    });
};

sim.pause = function() {
    cancelAnimationFrame(sim.animationFrameId);
};

sim.setup = function() {
    sim.N = 64;
    sim.size = sim.N*sim.N;

    ["u1","u0","v1","v0","q1","q0","zeros"].forEach(function(field) {
        sim[field] = new Float64Array(sim.size);
    });
    ["ubnd", "vbnd", "qbnd"].forEach(function(field) {
        sim[field] = new Int8Array(sim.size);
    });
    sim.canvas = document.querySelector("#stage");
    sim.ctx = sim.canvas.getContext("2d",{alpha:false});
    sim.canvas.width = sim.canvas.height = sim.N;
    sim.fpsEl = document.querySelector("#fps");
    sim.forceXEl = $("#force-x-input");
    sim.forceYEl = $("#force-y-input");
    sim.resetBoundaries();

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
        userInput.i = clamp(x*sim.N/e.target.offsetWidth |0, 1, sim.N);
        userInput.j = clamp(y*sim.N/e.target.offsetHeight |0 ,1, sim.N);
    }

    function $(s) {
        return document.querySelector(s);
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
    $("#color-button").addEventListener("click", function(e) {
        switchInputType(0);
    });
    $("#wall-button").addEventListener("click", function(e) {
        switchInputType(1);
    });
    $("#force-button").addEventListener("click", function(e) {
        switchInputType(2);
    });
    $("#forceremove-button").addEventListener("click", function(e) {
        sim.forces.length = 0;
    });
    $("#numiter-input").addEventListener("change", function(e) {
        var val = (+this.value |0) || 0;
        sim.numIter = val;
        this.value = val;
    });
    $("#viscosity-input").addEventListener("change", function(e) {
        var val = +this.value || 0;
        sim.viscosity = val;
        this.value = val;
    });
    $("#diffusion-input").addEventListener("change", function(e) {
        var val = +this.value || 0;
        sim.diffusion = val;
        this.value = val;
    });
    $("#color-clear-button").addEventListener("click", function(e) {
        sim.q1.set(sim.zeros);
    });
    $("#wall-clear-button").addEventListener("click", function(e) {
        sim.resetBoundaries();
    });
    $("#boxbnd-button").addEventListener("click", function(e) {
        sim.bndType = 0;
        sim.resetBoundaries();
    });
    $("#tunnelbnd-button").addEventListener("click", function(e) {
        sim.bndType = 1;
        sim.resetBoundaries();
    });
    $("#run-button").addEventListener("click", sim.run);
    $("#pause-button").addEventListener("click", sim.pause);
    sim.run();
};

sim.setup();

exports.sim = sim;

})(window);
