var raf = require('./raf.js');
var h = require('./helpers.js');

var VirtualWidget = function (originalVNode, ownerVWidget, Component) {
    this.name = Component.prototype.name;
    this.uid = h.getUniqueId();
    this.ownerVWidget = ownerVWidget;
    this.childrenVWidgets = [];
    this.originalVNode = originalVNode;
    this.Component = Component;

    if (ownerVWidget) {
        ownerVWidget.childrenVWidgets.push(this);
    }
};

VirtualWidget.prototype = {
    type: 'Widget',

    destroyed: false,

    init: function (isRoot) {
        var com = this.com = new this.Component(this);

        com.__mount();

        if (isRoot) {
            raf(function () {
                com.emit('DOMREADY');
            });
        }

        return com.node;
    },

    update: function (prevWidget, node) {
        var com = this.com = prevWidget.com;

        com.__vWidget = this;
        com.node = node;
        com.__update();

        prevWidget.getChildrenWidgets().forEach(function (widget) {
            if (widget.com && !h.checkNodeForParent(widget.com.node, document)) {
                widget.destroy(widget.com.node);
            }
        });

        return node;
    },

    destroy: function (node) {
        if (this.destroyed) {
            return;
        }

        this.com.componentWillUnmount();
        this.com.unassignEvents();

        this.destroyed = true;
    },

    getParentWidgets: function (list) {
        list = list || [];

        list.push(this);

        if (this.ownerVWidget) {
            this.ownerVWidget.getParentWidgets(list);
        }

        return list;
    },

    getChildrenWidgets: function (list) {
        list = list || [];

        for (var i = 0, length = this.childrenVWidgets.length; i < length; i++) {
            this.childrenVWidgets[i].getChildrenWidgets(list);
        }

        list.push(this);

        return list;
    },

    trigger: function (widgets, event, args) {
        for (var i = 0, length = widgets.length; i < length; i++) {
            if (widgets[i].com) {
                widgets[i].com.trigger(event, args);
            }
        }
    },

    compile: function (vNode, componentsHash, isChild) {
        if (!vNode) {
            throw error('Empty render', 'Empty render results in {0} component!', this.com.name);
        }

        if (typeof vNode === 'string') {
            vNode = h.fromHTML(vNode).children[1].children[0];
        }

        if (vNode.type !== 'VirtualNode') {
            return vNode;
        }

        var Component = componentsHash[vNode.tagName], vWidget;

        if (Component) {
            Component.prototype.name = Component.prototype.name || vNode.tagName;

            vWidget = new VirtualWidget(vNode, this, Component);
        }

        var children = vNode.children || [];

        // Compile child nodes and correcting virtual-dom's count value
        for (var i = 0, length = children.length; i < length; i++) {
            var currCount = children[i].count;

            children[i] = this.compile(children[i], componentsHash, true);
            vNode.count -= (currCount || 0) - (children[i].count || 0);
        }

        // If there is parent widget and current node has children attribute then use child nodes by parent widget
        // also correcting count value
        if (this.originalVNode && this.originalVNode.children && vNode.properties.attributes.hasOwnProperty('children')) {
            vNode.children = this.originalVNode.children;
            vNode.count = this.originalVNode.count;
        }

        // Looking node key for virtual-dom
        var key = vNode.key || vNode.properties.attributes.key || undefined;

        vWidget ? vWidget.id = key : vNode.key = key;

        var result = vWidget || vNode;

        if (!isChild) {
            if (result.properties && result.properties.className || (this.originalVNode && this.originalVNode.properties.className)) {
                var className = (result.properties.className || '') + ' ' + (this.originalVNode && this.originalVNode.properties.className || '');

                result.properties.className = result.properties.attributes['class'] = className;
            }
        }

        return result;
    }
};

module.exports = VirtualWidget;
