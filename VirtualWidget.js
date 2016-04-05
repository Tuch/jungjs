var h = require('./helpers.js');

var VirtualWidget = function (ownerVWidget, originalVNode, Component) {
    this.name = Component.prototype.name;
    this.id = originalVNode && originalVNode.key;
    this.ownerVWidget = ownerVWidget;
    this.originalVNode = originalVNode;
    this.Component = Component;
    this.properties = {};
};

VirtualWidget.prototype = {
    type: 'Widget',

    init: function (isRoot) {
        var com = this.com = new this.Component(this);

        com.__mount();

        return com.node;
    },

    update: function (prevWidget, node) {
        var com = this.com = prevWidget.com;

        com.node = node;
        com.__vWidget = this;
        com.__update();

        return node;
    },

    destroy: function () {
        this.com.unmount();
    }
};

module.exports = VirtualWidget;
