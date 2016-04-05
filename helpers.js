var dom = require('virtual-dom');
var fromHTML = require('vdom-virtualize').fromHTML;
var toHTML = require('vdom-to-html');

exports.noop = function () {};

exports.toDOM = function (vNode) {
    return dom.create(vNode, {warn: console.warn.bind(console)});
};

exports.toHTML = function (vNode) {
    return toHTML(vNode);
};

exports.fromHTML = function (vNode) {
    return fromHTML(vNode);
};

exports.getDiff = function (oldVNode, newVNode) {
    return dom.diff(oldVNode, newVNode);
};

exports.applyPatch = function (node, patch) {
    return dom.patch(node, patch);
};

exports.snakeToCamel = function (string) {
    return string.replace(/(\-\w)/g, function (m) {
        return m[1].toUpperCase();
    });
};

exports.camelToSnake = function(string) {
    return string.replace(/([A-Z])/g, function(m) {
        return '-' + m.toLowerCase();
    });
};

var s4 = exports.s4 = function() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
};

exports.getUniqueId = function() {
    return s4() + '-' + s4();
};

var findLostComs = exports.findLostComs = function (patch, type, list) {
    list = list || [];

    for (var key in patch) {
        var val = patch[key];

        if (val instanceof Array) {
            findLostComs(val, type, list);
        } else if (val.type === type) {
            findComs(val.vNode, list, true);
        }
    }

    return list;
}

var findComs = exports.findComs = function (vNode, list) {
    list = list || [];

    if (vNode.type === 'Widget') {
        list.unshift(vNode.com);
    } else if (vNode.children) {
        for (var i = 0, length = vNode.children.length; i < length; i++) {
            findComs(vNode.children[i], list);
        }
    }

    return list;
}
