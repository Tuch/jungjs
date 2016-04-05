var raf = require('./raf.js');
var queue = [];

module.exports = function (fn) {
    if (!queue.length) {
        raf(function () {
            var _queue = queue.slice();

            queue.length = 0;

            for (var i = 0, length = _queue.length; i < length; i++) {
                _queue[i]();
            };

        });
    }

    queue.push(fn);
};
