module.exports = function () {
    var code = arguments[0],
        prefix = '[JungJS:' + code + '] ',
        template = arguments[1],
        templateArgs = arguments,
        stringify = function (obj) {
            if (typeof obj === 'function') {
                return obj.toString().replace(/ \{[\s\S]*$/, '');
            } else if (typeof obj === 'undefined') {
                return 'undefined';
            } else if (typeof obj !== 'string') {
                return JSON.stringify(obj);
            }
            return obj;
        },
        message, i;

    message = prefix + template.replace(/\{\d+\}/g, function (match) {
        var index = +match.slice(1, -1), arg;

        if (index + 2 < templateArgs.length) {
            arg = templateArgs[index + 2];
            if (typeof arg === 'function') {
                return arg.toString().replace(/ ?\{[\s\S]*$/, '');
            } else if (typeof arg === 'undefined') {
                return 'undefined';
            } else if (typeof arg !== 'string') {
                return JSON.stringify(arg);
            }
            return arg;
        }
        return match;
    });

    return new Error(message);
}
