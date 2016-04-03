var raf = require('./raf.js');
var h = require('./helpers.js');

var VirtualWidget = function (ownerVWidget, originalVNode, Component) {
    this.name = Component.prototype.name;
    this.id = originalVNode ? originalVNode.key : this.name;
    this.ownerVWidget = ownerVWidget;
    this.childrenVWidgets = [];
    this.originalVNode = originalVNode;
    this.Component = Component;
    this.properties = {};

    if (ownerVWidget) {
        ownerVWidget.childrenVWidgets.push(this);
    }
};

VirtualWidget.prototype = {
    type: 'Widget',

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

        com.node = node;
        com.__vWidget = this;
        !com.__destroyed && com.__update();

        //TODO: children auto destroy process should be optimized
        prevWidget.getChildrenComs().forEach(function (com) {
            if (com && !h.checkNodeForParent(com.node, document)) {
                com.emit('DESTROY');
            }
        });

        return node;
    },

    destroy: function () {
        this.com.emit('DESTROY');
    },

    getParentComs: function (list) {
        list = list || [];

        list.push(this.com);

        if (this.ownerVWidget) {
            this.ownerVWidget.getParentComs(list);
        }

        return list;
    },

    getChildrenComs: function (list) {
        list = list || [];

        for (var i = 0, length = this.childrenVWidgets.length; i < length; i++) {
            this.childrenVWidgets[i].getChildrenComs(list);
        }

        list.push(this.com);

        return list;
    }
};

module.exports = VirtualWidget;
