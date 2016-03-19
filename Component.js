var raf = require('./raf.js');
var error = require('./error.js');
var parse = require('./parse.js');
var h = require('./helpers.js');
var extend = require('./extend.js');
var defaults = require('./defaults.js');
var Base = require('./Base.js');

var Component = Base.extend({
    name: 'NO-NAME',
    assignEvents: h.noop,
    unassignEvents: h.noop,
    componentWillMount: h.noop,
    componentDidMount: h.noop,
    componentWillUpdate: h.noop,
    componentDidUpdate: h.noop,
    componentWillUnmount: h.noop,
    componentWillReceiveProps: h.noop,
    getChildContext: h.noop,
    propTypes: {},
    dataAttrs: {},
    childrens: {},
    __phase: 'MOUNTING',
    __isInitedRafForceUpdate: false,

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
        this.on('DOMREADY', this.__onDomReady);
        this.on('DESTROY', this.__onDestroy);
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

    __onDomReady: function () {
        var phase = this.__phase;

        this.__phase = 'READY';
        if (phase === 'MOUNTING') {
            this.componentDidMount();
        }

        if (phase === 'UPDATING') {
            this.componentDidUpdate(this.__prevProps, this.__prevState);
            delete this.__prevProps;
            delete this.__prevState;
        }
    },

    __onDestroy: function () {
        if (this.node.remove) {
            this.node.remove();

        } else if (this.node.removeNode) {
            this.node.removeNode(true);
        }
        this.__vWidget.destroy(this.node);
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
        return this.__vWidget.compile(this.render(), this.constructor.childrens);
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

        return this;
    },

    __update: function (isInitiator, props) {
        this.__phase = 'UPDATING';
        this.__nextProps = this.__createProps(isInitiator ? (props || this.props) : null);
        this.__nextState = this.__nextState || this.state;

        if (this.__nextProps !== this.props) {
            this.componentWillReceiveProps(this.__nextProps, this.__nextState);
        }

        if (!this.shouldComponentUpdate(this.__nextProps, this.__nextState)) {
            this.state = this.__nextState || this.state;
            this.props = this.__nextProps || this.props;
            delete this.__nextProps;
            delete this.__nextState;

            return this;
        }

        this.componentWillUpdate(this.__nextProps, this.__nextState);

        this.__prevProps = this.props;
        this.__prevState = this.state;
        this.state = this.__nextState || this.state;
        this.props = this.__nextProps || this.props;
        delete this.__nextProps;
        delete this.__nextState;

        var newVNode = this.__compile();

        this.node = h.applyPatch(this.node, h.getDiff(this.vNode, newVNode));

        var emptyWidget = h.findEmptyWidget(newVNode);

        if (emptyWidget) {
            console.warn('Do you have widget without component! Check uniqueness of your keys in this widget!', this.__vWidget.name);
            console.warn('Empty widget', emptyWidget);
            console.warn('old vNode', this.vNode);
            console.warn('new vNode', newVNode);
        }

        this.vNode = newVNode;

        return this;
    },

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
        if (this.isReady()) {
            this.__initRafForceUpdate(props);
        }

        return this;
    },

    replaceState: function (state) {
        this.__nextState = state;

        return this.forceUpdate();
    },

    __initRafForceUpdate: function (props) {
        if (this.__isInitedRafForceUpdate) {
            return this;
        }

        this.__isInitedRafForceUpdate = true;

        raf(function () {
            this.__isInitedRafForceUpdate = false;
            this.__vWidget.childrenVWidgets.length = 0;
            this.__update(true, props).emit('DOMREADY');
        }.bind(this));

        return this;
    },

    forceUpdate: function (props) {
        if (this.isReady()) {
            this.__initRafForceUpdate(props);
        }

        return this;
    },

    broadcast: function (event, args) {
        this.__vWidget.trigger(this.__vWidget.getParentWidgets(), event, args);

        return this;
    },

    destroy: function () {
        this.emit('DESTROY');

        return this;
    },

    emit: function (event, args) {
        this.__vWidget.trigger(this.__vWidget.getChildrenWidgets(), event, args);

        return this;
    },

    trigger: function (event, args) {
        var events = this.__events[event] = this.__events[event] || {};

        for (var hash in events) {
            events[hash].apply(this, args);
        }

        return this;
    },

    on: function (event, fn) {
        var events = this.__events[event] = this.__events[event] || {},
            hash = h.s4();

        events[hash] = fn;

        return function off () {
            delete events[hash];
        };
    },

    __toTypes: (function () {
        var map = {};

        map[Function] = function (value) { return typeof value === 'function' ? value : h.noop; };
        map[Object] = function (value) { return typeof value === 'object' ? value : {}; };
        map[Array] = function (value) { return value instanceof Array ? value : []; };
        map[Boolean] = function (value) { return value === 'true'; };
        map[Number] = Number;
        map[String] = String;

        return map;
    })()
});

module.exports = Component;
