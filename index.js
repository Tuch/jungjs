let VirtualWidget = require('./VirtualWidget.js');
let Component = require('./Component.js');

let componentsHash = {};

let Jung = module.exports = {
    component (name, proto) {
        componentsHash[name.toUpperCase()] = Component.extend(proto);
    },

    render (vNode, node, proto) {
        return VirtualWidget.render(vNode, node, proto, componentsHash);
    }
};
