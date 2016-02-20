var dom = require('virtual-dom');
var fromHTML = require('vdom-virtualize').fromHTML;
var toHTML = require('vdom-to-html');

exports.noop = function () {};

exports.registerComponent = function (name, getter, componentsHash) {
    componentsHash[name.toUpperCase()] = getter;
};

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
    return string.replace(/([A-Z])/g, function($1) {
        return '-' + $1.toLowerCase();
    });
};

let s4 = exports.s4 = function() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
};

exports.getUniqueId = function() {
    return s4() + '-' + s4();
};

exports.checkNodeForParent = function(node, parent) {
    while (node = node.parentNode) {
        if (node === parent) {
            return true;
        }
    }

    return false;
};

let findEmptyWidget = exports.findEmptyWidget = function (vNode) {
    if (vNode.Component && !vNode.com) {
        return vNode;
    }

    if (vNode.children) {
        for (var i = 0, length = vNode.children.length, result; i < length; i++) {
            result = findEmptyWidget(vNode.children[i]);

            if (result) {
                return result;
            }
        }
    }
};

let getRootWidget = exports.getRootWidget = function (vNode) {
    if (vNode.type === 'Widget') {
        return vNode;
    }

    if (!vNode.children) {
        return undefined;
    }

    for (var i = 0, length = vNode.children.length; i < length; i++) {
        var widget = getRootWidget(vNode.children[i]);

        if (widget) {
            return widget;
        }
    }
};
