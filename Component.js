var error = require('./error.js');
var parse = require('./parse.js');
var h = require('./helpers.js');
var extend = require('./extend.js');
var defaults = require('./defaults.js');
var Base = require('./Base.js');
var compile = require('./compile.js');
var rafQueue = require('./rafQueue.js');

var Component = Base.extend({
    name: '',
    assignEvents: h.noop,
    unassignEvents: h.noop,
    componentWillMount: h.noop,
    componentDidMount: h.noop,
    componentWillUpdate: h.noop,
    componentDidUpdate: h.noop,
    componentWillUnmount: h.noop,
    componentDidUnmount: h.noop,
    componentWillReceiveProps: h.noop,
    getChildContext: h.noop,
    propTypes: {},
    dataAttrs: {},
    childrens: {},
    __phase: 'MOUNTING',
    __isInitedRafForceUpdate: false,
    __isMounted: false,

    constructor: function (vWidget) {
        this.__uid = h.getUniqueId();
        this.__events = {};
        this.__vWidget = vWidget || {};
        this.__initContext();
        this.constructor.defaultProps = this.constructor.defaultProps || this.getDefaultProps();
        this.constructor.childrens = this.constructor.childrens || this.__defineChildrens();
        this.state = this.getInitialState();
        this.props = this.__createProps();
        this.selectors = this.__getInintialSelectors();
        this.__onMount = this.__onMount.bind(this);
        this.__onUnmount = this.__onUnmount.bind(this);
    },

    __initContext: function () {
        var ownerVWidget = this.__vWidget.ownerVWidget;

        if (!ownerVWidget) {
            return this;
        }

        var com = ownerVWidget.com;

        this.context = com.getChildContext() || com.context;

        return this;
    },

    __defineChildrens: function () {
        var childrens = {};

        for (var name in this.childrens) {
            childrens[name.toUpperCase()] = Component.extend(this.childrens[name]);
        }

        return childrens;
    },

    __createProps: function (props) {
        props = props || this.__createPropsFromVNode();

        defaults(props, this.constructor.defaultProps);

        for (var prop in this.propTypes) {
            props[prop] = this.__valueToType(props[prop], this.propTypes[prop]);
        }

        props.children = props.children || [];

        return props;
    },

    __createPropsFromVNode: function () {
        var originalVNode = this.__vWidget.originalVNode;
        var ownerVWidget = this.__vWidget.ownerVWidget;
        var props = {}, snakeProp;

        if (!ownerVWidget || !originalVNode || !originalVNode.properties) {
            return props;
        }

        var potentialProps = originalVNode.properties.attributes;
        var additionalProps =  originalVNode.properties;

        for (var prop in this.propTypes) {
            snakeProp = h.camelToSnake(prop);

            props[prop] = this.__parseValueByType(
                potentialProps.hasOwnProperty(snakeProp) ? potentialProps[snakeProp] : additionalProps[prop],
                ownerVWidget.com,
                this.propTypes[prop]
            );
        }

        props.children = originalVNode.children;

        return props;
    },

    __parseValueByType: function (value, context, type) {
        switch (type) {
            case Function: return parse(value)(context);
            case Object: return parse(value)(context);
            case Array: return parse(value)(context);
        }

        return value;
    },

    __valueToType: function (value, type) {
        return this.__toTypes[type] ? this.__toTypes[type](value) : value;
    },

    __getInintialSelectors: function () {
        var selectors = {};

        for (var key in this.dataAttrs) {
            selectors[key] = '[' + this.dataAttrs[key] + ']';
        }

        return selectors;
    },

    __compile: function () {
        return compile(this.__vWidget, this.render(), this.constructor.childrens);
    },

    __mount: function () {
        this.componentWillMount();
        this.state = this.__nextState || this.state;
        this.props = this.__nextProps || this.props;
        delete this.__nextProps;
        delete this.__nextState;
        this.vNode = this.__compile();

        this.node = h.toDOM(this.vNode);
        this.node.com = this;
        this.assignEvents();

        rafQueue(this.__onMount);

        return this;
    },

    __onMount: function () {
        this.componentDidMount();
        this.__phase = 'READY';
        this.__isMounted = true;
    },

    __onUnmount: function () {
        this.componentDidUnmount();
    },

    __update: function (isInitiator, state, props) {
        if (!this.isMounted()) {
            return this;
        }

        this.__phase = 'UPDATING';

        var nextProps = this.__createProps(isInitiator ? (props || this.props) : null);
        var nextState = state || this.state;

        if (nextProps !== this.props) {
            this.componentWillReceiveProps(nextProps, nextState);
        }

        if (!this.shouldComponentUpdate(nextProps, nextState)) {
            this.state = nextState;
            this.props = nextProps;

            return this;
        }

        this.componentWillUpdate(nextProps, nextState);

        prevProps = this.props;
        prevState = this.state;

        this.state = nextState;
        this.props = nextProps;

        var newVNode = this.__compile();
        var patch = h.getDiff(this.vNode, newVNode);

        this.node = h.applyPatch(this.node, patch);
        this.vNode = newVNode;

        this.__unmountList(h.findLostComs(patch, 7));
        this.componentDidUpdate(prevProps, prevState);
        this.__phase = 'READY';

        return this;
    },

    __unmountList: function (coms) {
        for (var i = 0, length = coms.length; i < length; i++) {
            coms[i].unmount();
        };

        return this;
    },

    __toTypes: (function () {
        var map = {};

        map[Function] = function (value) { return typeof value === 'function' ? value : h.noop; };
        map[Object] = function (value) { return typeof value === 'object' ? value : {}; };
        map[Array] = function (value) { return value instanceof Array ? value : []; };
        map[Boolean] = function (value) { return value !== 'false' && !!value; };
        map[Number] = Number;
        map[String] = String;

        return map;
    })(),

    getInitialState: function () {
        return {};
    },

    getDefaultProps: function () {
        return {};
    },

    shouldComponentUpdate: function () {
        return true;
    },

    render: function () {
        throw error('No render function', this.name + '\'s render function is not defined!');
    },

    getDOMNode: function () {
        return this.node;
    },

    isReady: function () {
        return this.__phase === 'READY';
    },

    setState: function (state) {
        if (typeof state === 'function') {
            state = state(this.state, this.props);
        }

        return this.replaceState(extend({}, this.state, this.__nextState, state));
    },

    setProps: function (props) {
        if (typeof props === 'function') {
            props = props(this.state, this.props);
        }

        return this.replaceProps(extend({}, this.props, this.__nextProps, props));
    },

    replaceProps: function (props) {
        this.__nextProps = props;

        return this.forceUpdate();
    },

    replaceState: function (state) {
        this.__nextState = state;

        return this.forceUpdate();
    },

    forceUpdate: function () {
        if (this.__isInitedRafForceUpdate) {
            return this;
        }

        this.__isInitedRafForceUpdate = true;

        rafQueue(function () {
            this.__isInitedRafForceUpdate = false;
            this.__update(true, this.__nextState, this.__nextProps);
        }.bind(this));

        return this;
    },

    unmount: function () {
        if (!this.isMounted()) {
            return;
        }

        this.__unmountList(h.findComs(this.vNode));
        this.componentWillUnmount();
        this.unassignEvents();
        this.__isMounted = false;

        if (this.node.remove) {
            this.node.remove();
        } else if (this.node.removeNode) {
            this.node.removeNode(true);
        }

        delete this.node;

        rafQueue(this.__onUnmount);

        return this;
    },

    isMounted: function () {
        return this.__isMounted;
    }
});

module.exports = Component;
