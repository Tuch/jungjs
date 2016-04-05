var VirtualWidget = require('./VirtualWidget');
var error = require('./error');
var h = require('./helpers.js');
var parse = require('./parse.js');

var parseClassName = parse('properties.className');

function transcludeClassNames(originalVNode, vNode) {
    var originalVNodeCN = parseClassName(originalVNode) || '';
    var vNodeCN = parseClassName(vNode) || '';
    var className = (vNodeCN + ' ' + originalVNodeCN).trim();

    if (className) {
        vNode.properties.className = vNode.properties.attributes['class'] = className;
    }
}

var parseDefaultChildren = parse('props.children');

function transcludeChildren(ownerVWidget, vNode) {
    var originalVNode = ownerVWidget.originalVNode;
    var context = ownerVWidget.com;
    var children, expression;

    if (vNode.properties.attributes.hasOwnProperty('children')) {
        expression = vNode.properties.attributes.children;

        delete vNode.properties.attributes.children;

        if (expression) {
            children = parse(expression)(context);
        } else {
            children = parseDefaultChildren(context);
        }

        if (children) {
            vNode.children = children;
            vNode.count = sumChildrenCount(children);
        }

    }
}

function sumChildrenCount(children) {
    var acc = 0;

    for (var i = 0, length = children.length; i < length; i++) {
        acc += (children[i].count || 0);
    };

    return acc + children.length;
}

function tryToCreateVWidget(ownerVWidget, vNode, componentsHash) {
    var Component = componentsHash[vNode.tagName], vWidget;

    if (Component) {
        Component.prototype.name = Component.prototype.name || vNode.tagName;

        vWidget = new VirtualWidget(ownerVWidget, vNode, Component);
    }

    return vWidget;
}

function getKeyFromVNode(vNode) {
    return vNode.key || vNode.properties.attributes.key || undefined;
}

function compileVNode(ownerVWidget, componentsHash, vNode) {
    var children = vNode.children || [];

    for (var i = 0, length = children.length; i < length; i++) {
        var currCount = children[i].count;

        children[i] = compile(ownerVWidget, children[i], componentsHash);
        vNode.count -= (currCount || 0) - (children[i].count || 0);
    }

    transcludeChildren(ownerVWidget, vNode);

    vNode.key = getKeyFromVNode(vNode);
}

function compile(ownerVWidget, vNode, componentsHash) {
    if (vNode.type !== 'VirtualNode') {
        return vNode;
    }

    compileVNode(ownerVWidget, componentsHash, vNode);

    return tryToCreateVWidget(ownerVWidget, vNode, componentsHash) || vNode;
}

module.exports = function (ownerVWidget, vNode, componentsHash) {
    if (!vNode) {
        throw error('Empty render', 'Empty render results in {0} component!', ownerVWidget.name);
    }

    if (typeof vNode === 'string') {
        vNode = h.fromHTML(vNode).children[1].children[0];
    }

    compile(ownerVWidget, vNode, componentsHash);

    transcludeClassNames(ownerVWidget.originalVNode, vNode);

    return vNode;
};
