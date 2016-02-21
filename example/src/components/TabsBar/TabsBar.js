import delegate from 'delegate-events';

export default {
    name: 'TabsBar',

    template: require('./TabsBar.jst'),

    dataAttrs: {
        tab: 'data-tab'
    },

    propTypes: {
        currentTab: String,
        tabs: Array,
        onClick: Function
    },

    assignEvents () {
        delegate.bind(this.getDOMNode(), this.selectors.tab, 'click', this.onTabClick.bind(this), false);
    },

    onTabClick (e) {
        let key = e.delegateTarget.attributes.getNamedItem(this.dataAttrs.tab).textContent;

        this.props.onClick(key);
    },

    render () {
        return this.template(this.props);
    }
};
