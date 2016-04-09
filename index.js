var VirtualWidget = require('./VirtualWidget.js');
var Component = require('./Component.js');
var defaults = require('./defaults.js');

module.exports = {
    version: '1.1.1',
    createNode: function (componentProto, props) {
        var surrogateProto = {
            name: componentProto.name || 'ROOT',
            getDefaultProps: function () {
                return defaults(props, componentProto.getDefaultProps && componentProto.getDefaultProps());
            }
        };

        var vWidget = new VirtualWidget(
            null, null,
            Component.extend(componentProto).extend(surrogateProto)
        );

        return vWidget.init(true);
    },

    getComponent: function (node) {
        return node.com;
    },

    render: function (componentProto, rootNode, props) {
        var node = this.createNode(componentProto || {}, props);

        rootNode.appendChild(node);

        return this.getComponent(node);
    }
};
