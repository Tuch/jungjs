var h = require('./helpers.js');
var Component = require('./Component.js');
var extend = require('./extend.js');

let VirtualWidget = function (vNode, ownerVWidget, Component, componentsHash) {
    this.uid = h.getUniqueId();
    this.ownerVWidget = ownerVWidget;
    this.childrenVWidgets = [];
    this.originalVNode = vNode;
    this.Component = Component;
    this.componentsHash = componentsHash;

    if (ownerVWidget) {
        ownerVWidget.childrenVWidgets.push(this);
    }
};

VirtualWidget.prototype = {
    type: 'Widget',

    destroyed: false,

    init () {
        var com = this.com = new this.Component(this);

        com.__mount();

        return com.node;
    },

    update (prevWidget, node) {
        var com = this.com = prevWidget.com;

        com.__vWidget = this;
        com.node = node;
        com.__update();

        prevWidget.getChildrenWidgets().forEach(function (widget) {
            if (widget.com && !checkNodeForParent(widget.com.node, document)) {
                widget.destroy(widget.com.node);
            }
        });

        return node;
    },

    destroy (node) {
        if (this.destroyed) {
            return;
        }

        this.com.componentWillUnmount();
        this.com.unassignEvents();

        this.destroyed = true;
    },

    getParentWidgets (list) {
        list = list || [];

        list.push(this);

        if (this.ownerVWidget) {
            this.ownerVWidget.getParentWidgets(list);
        }

        return list;
    },

    getChildrenWidgets (list) {
        list = list || [];

        for (var i = 0, length = this.childrenVWidgets.length; i < length; i++) {
            this.childrenVWidgets[i].getChildrenWidgets(list);
        }

        list.push(this);

        return list;
    },

    trigger (widgets, event, args) {
        for (var i = 0, length = widgets.length; i < length; i++) {
            if (widgets[i].com) {
                widgets[i].com.trigger(event, args);
            }
        }
    },

    compile (vNode) {
        if (!vNode) {
            throw error('Empty render', 'Empty render results in {0} component!', this.com.name);
        }

        if (typeof vNode === 'string') {
            vNode = h.fromHTML(vNode).children[1].children[0];
        }

        if (vNode.type !== 'VirtualNode') {
            return vNode;
        }

        var Component = this.componentsHash[vNode.tagName], vWidget;

        if (Component) {
            vWidget = new VirtualWidget(vNode, this, Component, this.componentsHash);
        }

        var children = vNode.children || [];

        // Compile child nodes and correcting virtual-dom's count value
        for (var i = 0, length = children.length; i < length; i++) {
            var currCount = children[i].count;

            children[i] = this.compile(children[i]);
            vNode.count -= (currCount || 0) - (children[i].count || 0);
        }

        // If there is parent widget and current node has children attribute then use child nodes by parent widget
        // also correcting count value
        if (this.originalVNode.children && vNode.properties.attributes.hasOwnProperty('children')) {
            vNode.children = this.originalVNode.children;
            vNode.count = this.originalVNode.count;
        }

        // Looking node key for virtual-dom
        var key = vNode.key || vNode.properties.attributes.key || undefined;

        vWidget ? vWidget.id = key : vNode.key = key;

        return vWidget || vNode;
    }
};

module.exports = VirtualWidget;

module.exports.render = function (vNode, node, proto, componentsHash) {
    proto = extend({
        render: function () {
            return vNode;
        }
    }, proto);

    let vWidget = new VirtualWidget(h.fromHTML('<div></div>'), null, Component.extend(proto), componentsHash);

    node.appendChild(vWidget.init());

    vWidget.com.emit('DOMREADY');

    return vWidget.com;
};
