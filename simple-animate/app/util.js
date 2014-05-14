var $ = function(s,a,p) {
    p = p || document;
    return a ? p.querySelectorAll(s) : p.querySelector(s);
};
$.extend = function(a, b) {
    for (var i in b) a[i] = b[i];
    return a;
};
$.getNeighbor = function(el, arr, rightward, strict) {
    var i = arr.indexOf(el);
    if (i < 0) throw new Error("Element not in array.");
    var result = arr[i-1], right = arr[i+1];
    if (strict) {
        if (rightward) result = right;
    } else if (result === undefined || rightward && right !== undefined) {
        result = right; // use right if exists and no left
    }
    return result || null;
};
$.make = function(t,a,p,w) {
    w = w || window;
    var el = w.document.createElement(t);
    if (typeof a === "object") {
        $.extend(el, a);
    }
    if (p && p.appendChild) {
        p.appendChild(el);
    }
    return el;
};
$.removeElement = function(el) {
    el.parentNode.removeChild(el);
};
$.swapElementSiblings = function(a, b) {
    var container = a.parentNode;
    var bNeighbor = b.nextElementSibling;
    if (bNeighbor === a) {
        // special case [b a ...]
        container.removeChild(a);     // [b ...]
        container.insertBefore(a, b); // [a b ...]
    } else {
        // should always work unless special case above
        // [a x b y]
        container.removeChild(b);     // [a x y]
        container.insertBefore(b, a); // [b a x y]
        container.removeChild(a);     // [b x y]
        if (bNeighbor) {
            container.insertBefore(a, bNeighbor); // [b x a y]
        } else {
            container.appendChild(a); // [b a (x y)]
        }
    }
};

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// requestAnimationFrame polyfill by Erik Möller
// fixes from Paul Irish and Tino Zijdel
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback, element) {
            var currTime = Date.now();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }
 
    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }
}());
