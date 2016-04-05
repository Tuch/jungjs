var noop = function () { };

var setter = function (context, value, path) {
    evalInContext(context, 'this.' + path + ' = value;', {'value': value});
}

var prepareContextMethod = function (method, context, source) {
    return typeof method === 'function' ? function () {
        return method.apply(context, arguments);
    } : method;
}

var evalInContext = function (context, source, locals) {
    if (source === undefined) {
        return;
    }

    locals = locals || {};

    var args = [], values = [], result, key;

    for (key in context) {
        args.push(key);
        values.push(prepareContextMethod(context[key], context, source));
    }

    for (key in locals) {
        args.push(key);
        values.push(prepareContextMethod(locals[key], context, source));
    }

    args.push('return ' + source);

    try {
        result = Function.apply(null, args).apply(context, values);
    } catch (e) {
        console.error('$parse:', e);
    }

    return result;
}

function getValueByPath(acc, path) {
    path = path.split('.');

    for (var i = 0, length = path.length; i < length; i++) {
        acc = typeof acc === 'object' && acc ? acc[path[i]] : undefined;
    }

    return acc;
}

var isExpression = /\=|\[|\(|\;/;

module.exports = function (expression) {
    if (expression === undefined) {
        return noop;
    }

    expression = expression.trim();

    var isPath = !isExpression.test(expression);

    var getter = function (context, locals) {
        if (isPath) {
            var value = getValueByPath(context, expression);

            return typeof value === 'function' ? value.bind(context) : value;
        }

        return evalInContext(context, expression, locals);
    }

    getter.assign = function (context, value) {
        setter(context, value, expression);
    }

    return getter;
};
