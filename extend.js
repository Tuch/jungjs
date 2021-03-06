module.exports = function (dst) {
    var args = Array.prototype.slice.call(arguments, 1);

    dst = dst || {};

    for (var i = 0, length = args.length; i < length; i++) {
        var obj = args[i];

        if (obj) {
            for (var key in obj) {
                dst[key] = obj[key];
            }
        }
    }

    return dst;
};
