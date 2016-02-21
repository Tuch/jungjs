var VirtualWidget = require('./VirtualWidget.js');
var Component = require('./Component.js');
var extend = require('./extend.js');

module.exports = {
    createNode: function (componentProto, initialState) {
        var surrogateProto = {
            getInitialState: function () {
                return extend(componentProto.getInitialState && componentProto.getInitialState() || {}, initialState);
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

    render: function (componentProto, rootNode, initialState) {
        var node = this.createNode(componentProto, initialState);

        rootNode.appendChild(node);

        return this.getComponent(node);
    }
};
