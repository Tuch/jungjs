import cn from './TabsExample.css';
import content from './content.json';
import delegate from 'delegate-events';

export default {
    name: 'TabsExample',

    template: require('./TabsExample.jst'),

    dataAttrs: {
        tab: 'data-tab'
    },

    getInitialState () {
        return {
            currentTab: 'tab2'
        }
    },

    assignEvents () {
        delegate.bind(this.getDOMNode(), this.selectors.tab, 'click', this.onTabClick.bind(this), false);
    },

    onTabClick (e) {
        let name = e.delegateTarget.attributes.getNamedItem(this.dataAttrs.tab).textContent;

        this.setState({
            currentTab: name
        });
    },

    render () {
        return this.template({state: this.state, content: content[this.state.currentTab], cn: cn});
    }
};
