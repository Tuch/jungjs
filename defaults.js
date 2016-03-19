module.exports = function (dst) {
    var args = Array.prototype.slice.call(arguments, 1);

    dst = dst || {};

    for (var i = args.length; i; i--) {
        var obj = args[i - 1];

        if (obj) {
            for (var key in obj) {
                dst[key] = dst[key] === undefined ? obj[key] : dst[key];
            }
        }
    }

    return dst;
};
