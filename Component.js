var raf = require('./raf.js');
var error = require('./error.js');
var parse = require('./parse.js');
var h = require('./helpers.js');
var extend = require('./extend.js');
var Base = require('./Base.js');

var Component = Base.extend({
    name: 'Component name',
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
    __supportedTypes: [Function, Object, Array, Boolean, Number, String],

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
        };

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

    __createProps: function () {
        var props = {}, vWidget = this.__vWidget;

        extend(props, this.constructor.defaultProps);

        if (!vWidget.ownerVWidget) {
            props.children = [];

            return props;
        }

        var potentialProps = vWidget.originalVNode.properties.attributes,
            additionalProps =  vWidget.originalVNode.properties;

        this.__getScalarsByName = potentialProps['scalars-mode'] === 'name';

        for (var prop in this.propTypes) {
            var snakeProp = h.camelToSnake(prop);
            var propType = this.propTypes[prop];

            if (this.__isTypeSupported(propType)) {
                props[prop] = this.__parseProp(
                    propType,
                    prop,
                    potentialProps.hasOwnProperty(snakeProp) ? potentialProps[snakeProp] : additionalProps[prop],
                    vWidget.ownerVWidget.com,
                    props[prop]
                );
            }
        }

        props.children = vWidget.originalVNode.children;

        return props;
    },

    __parseProp: function (propType, propName, propValue, ownerCom, defaultValue) {
        switch (propType) {
            case Function:
                return this.__getValueByExpression(propValue, ownerCom, defaultValue || h.noop);
            break;

            case Object:
                return this.__getValueByExpression(propValue, ownerCom, defaultValue || {});
            break;

            case Array:
                return this.__getValueByExpression(propValue, ownerCom, defaultValue || []);
            break;

            case Boolean:
                return this.__parseBooleanProp(propName, propValue, ownerCom, defaultValue);
            break;

            case String:
                return this.__parseStringProp(propName, propValue, ownerCom, defaultValue || '');
            break;

            case Number:
                return this.__parseNumberProp(propName, propValue, ownerCom, defaultValue || NaN);
            break;
        }
    },

    __isTypeSupported: function (type) {
        return this.__supportedTypes.indexOf(type) != -1;
    },

    __getValueByExpression: function (propValue, context, defaultValue) {
        var value = parse(propValue)(context);

        if (typeof value === 'undefined') {
            value = defaultValue;
        }

        return value;
    },

    //todo: нужно убрать три функции внизу. Возможно удалить scalar-prop
    __parseBooleanProp: function (propName, propValue, owner, defaultValue) {
        propValue = this.__parseScalarProp(propName, propValue, owner, defaultValue);
        return Boolean(propValue && propValue !== 'false')
    },

    __parseStringProp: function (propName, propValue, owner, defaultValue) {
        propValue = this.__parseScalarProp(propName, propValue, owner, defaultValue);
        return String(propValue);
    },

    __parseNumberProp: function (propName, propValue, owner, defaultValue) {
        propValue = this.__parseScalarProp(propName, propValue, owner, defaultValue);

        return Number(propValue);
    },

    __parseScalarProp: function (propName, propValue, owner, defaultValue) {
        var result = this.__getScalarsByName ? parse(propValue)(owner) : propValue;

        return result === undefined ? defaultValue : result;
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

    __update: function (isInitiator) {
        this.__phase = 'UPDATING';
        this.__nextProps = isInitiator ? this.props : this.__createProps();
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

    replaceState: function (state) {
        this.__nextState = state;

        return this.forceUpdate();
    },

    __initRafForceUpdate: function () {
        if (this.__isInitedRafForceUpdate) {
            return this;
        }

        this.__isInitedRafForceUpdate = true;

        raf(function () {
            this.__isInitedRafForceUpdate = false;
            this.__vWidget.childrenVWidgets.length = 0;
            this.__update(true).emit('DOMREADY');
        }.bind(this));

        return this;
    },

    forceUpdate: function () {
        if (this.isReady()) {
            this.__initRafForceUpdate();
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
    }
});

module.exports = Component;
