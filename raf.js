var requestAnimationFrame = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame,
    cancelAnimationFrame = window.cancelAnimationFrame ||
        window.webkitCancelAnimationFrame ||
        window.mozCancelAnimationFrame ||
        window.webkitCancelRequestAnimationFrame;

var rafSupported = !!requestAnimationFrame,
    nativeFn = function (fn) {
        var id = requestAnimationFrame(function () {
            fn && fn.apply(this);
        });
        return function () {
            cancelAnimationFrame(id);
        };
    },
    polyfillFn = function (fn) {
        var timer = setTimeout(fn, 16.66);
        return function () {
            clearTimeout(timer);
        };
    },
    raf = rafSupported ? nativeFn : polyfillFn;;

raf.supported = rafSupported;

module.exports = raf;
