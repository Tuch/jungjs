let extend = require('./extend.js');

function Base () { }

Base.extend = function (protoProps, staticProps) {
    var Parent = this,
        Child;

    if (protoProps.hasOwnProperty('constructor')) {
        Child = protoProps.constructor;
    } else {
        Child = function () {
            return Parent.apply(this, arguments);
        };
    }

    extend(Child, Parent, staticProps);

    function Surrogate () {
        this.constructor = Child;
    }

    Surrogate.prototype = Parent.prototype;

    Child.prototype = new Surrogate();

    extend(Child.prototype, protoProps);

    return Child;
}

module.exports = Base;
