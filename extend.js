module.exports = function (dst) {
    var args = Array.prototype.slice.call(arguments, 1);

    for (var i = 0, length = args.length; i < length; i++) {
        var obj = args[i] || {};

        for (var key in obj) {
            dst[key] = obj[key];
        }
    }

    return dst;
};
