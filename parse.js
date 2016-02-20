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

    var args = [],
        values = [],
        result;

    for (var key in context) {
        args.push(key);
        values.push(prepareContextMethod(context[key], context, source));
    }

    for (var key in locals) {
        args.push(key);
        values.push(prepareContextMethod(locals[key], context, source));
    }

    args.push('return ' + source);

    try {
        result = Function.apply(null, args).apply(context, values);
    } catch (e) {
        console.error('$parse:', e)
    }

    return result;
}

module.exports = function (expression) {
    var getter = function (context, locals) {
        return evalInContext(context, expression, locals);
    }

    getter.assign = function (context, value) {
        setter(context, value, expression);
    }

    return getter;
};
