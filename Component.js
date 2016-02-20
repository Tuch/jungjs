var raf = require('./raf.js');
var error = require('./error.js');
var parse = require('./parse.js');
var h = require('./helpers.js');
var extend = require('./extend.js');
var Base = require('./Base.js');

module.exports = Base.extend({
    constructor (vWidget) {
        this.name = 'Component name';
        this.assignEvents = h.noop;
        this.unassignEvents = h.noop;
        this.componentWillMount = h.noop;
        this.componentDidMount = h.noop;
        this.componentWillUpdate = h.noop;
        this.componentDidUpdate = h.noop;
        this.componentWillUnmount = h.noop;
        this.componentWillReceiveProps = h.noop;
        this.getChildContext = h.noop;
        this.propTypes = {};
        this.dataAttrs = {};
        this.__phase = 'MOUNTING';
        this.__isInitedRafForceUpdate = false;
        this.__supportedTypes = [Function, Object, Array, Boolean, Number, String];

        this.__uid = h.getUniqueId();
        this.__events = {};
        this.__vWidget = vWidget;
        this.__initContext();
        this.constructor.defaultProps = this.constructor.defaultProps || this.getDefaultProps();
        this.state = this.getInitialState();
        this.props = this.__createProps();
        this.selectors = this.__getInintialSelectors();
        this.on('DOMREADY', this.__onDomReady);
        this.on('DESTROY', this.__onDestroy);
    },

    __initContext () {
        var ownerVWidget = this.__vWidget.ownerVWidget;

        if (!ownerVWidget) {
            return this;
        }

        var com = ownerVWidget.com;

        this.context = com.getChildContext() || com.context;

        return this;
    },

    __onDomReady () {
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

    __onDestroy () {
        if (this.node.remove) {
            this.node.remove();

        } else if (this.node.removeNode) {
            this.node.removeNode(true);
        }
        this.__vWidget.destroy(this.node);
    },

    __createProps () {
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

    __parseProp (propType, propName, propValue, ownerCom, defaultValue) {
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

    __isTypeSupported (type) {
        return this.__supportedTypes.indexOf(type) != -1;
    },

    __getValueByExpression (propValue, context, defaultValue) {
        var value = parse(propValue)(context);

        if (typeof value === 'undefined') {
            value = defaultValue;
        }

        return value;
    },

    //todo: нужно убрать три функции внизу. Возможно удалить scalar-prop
    __parseBooleanProp (propName, propValue, owner, defaultValue) {
        propValue = this.__parseScalarProp(propName, propValue, owner, defaultValue);
        return Boolean(propValue && propValue !== 'false')
    },

    __parseStringProp (propName, propValue, owner, defaultValue) {
        propValue = this.__parseScalarProp(propName, propValue, owner, defaultValue);
        return String(propValue);
    },

    __parseNumberProp (propName, propValue, owner, defaultValue) {
        propValue = this.__parseScalarProp(propName, propValue, owner, defaultValue);

        return Number(propValue);
    },

    __parseScalarProp (propName, propValue, owner, defaultValue) {
        var result = this.__getScalarsByName ? parse(propValue)(owner) : propValue;

        return result === undefined ? defaultValue : result;
    },

    __getInintialSelectors () {
        var selectors = {};

        for (var key in this.dataAttrs) {
            selectors[key] = '[' + this.dataAttrs[key] + ']';
        }

        return selectors;
    },

    __compile () {
        var renderResult = this.render();
        var vNode = this.__vWidget.compile(renderResult, this.__vWidget);

        if (vNode.properties && vNode.properties.className || this.__vWidget.originalVNode.properties.className) {
            vNode.properties.className = (vNode.properties.className || '') + ' ' + (this.__vWidget.originalVNode.properties.className || '');
        }

        return vNode;
    },

    __mount () {
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

    __update (isInitiator) {
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

        var emptyWidget = findEmptyWidget(newVNode);

        if (emptyWidget) {
            console.warn('Do you have widget without component! Check uniqueness of your keys in this widget!', this.__vWidget.name);
            console.warn('Empty widget', emptyWidget);
            console.warn('old vNode', this.vNode);
            console.warn('new vNode', newVNode);
        }

        this.vNode = newVNode;

        return this;
    },

    getInitialState () {
        return {};
    },

    getDefaultProps () {
        return {};
    },

    shouldComponentUpdate () {
        return true;
    },

    render () {
        throw error('No render function', this.name + '\'s render function is not defined!');
    },

    getDOMNode () {
        return this.node;
    },

    isReady () {
        return this.__phase === 'READY';
    },

    setState (state) {
        if (typeof state === 'function') {
            state = state(this.state, this.props);
        }

        return this.replaceState(extend({}, this.state, this.__nextState, state));
    },

    replaceState (state) {
        this.__nextState = state;

        return this.forceUpdate();
    },

    __initRafForceUpdate () {
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

    forceUpdate () {
        if (this.isReady()) {
            this.__initRafForceUpdate();
        }

        return this;
    },

    broadcast (event, args) {
        this.__vWidget.trigger(this.__vWidget.getParentWidgets(), event, args);

        return this;
    },

    destroy () {
        this.emit('DESTROY');

        return this;
    },

    emit (event, args) {
        this.__vWidget.trigger(this.__vWidget.getChildrenWidgets(), event, args);

        return this;
    },

    trigger (event, args) {
        var events = this.__events[event] = this.__events[event] || {};

        for (var hash in events) {
            events[hash].apply(this, args);
        }

        return this;
    },

    on (event, fn) {
        var events = this.__events[event] = this.__events[event] || {},
            hash = h.s4();

        events[hash] = fn;

        return function off () {
            delete events[hash];
        };
    }
});
