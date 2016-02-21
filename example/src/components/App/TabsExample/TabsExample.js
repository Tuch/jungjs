import TabsBar from 'TabsBar/TabsBar.js';
import ProgressBar from 'ProgressBar/ProgressBar.js';
import cn from './TabsExample.css';
import content from './content.json';

export default {
    name: 'TabsExample',

    template: require('./TabsExample.jst'),

    childrens: {
        TabsBar: TabsBar,
        ProgressBar: ProgressBar
    },

    getInitialState () {
        return {
            currentTabKey: 'tab1'
        }
    },

    tabs: [{
        name: 'tab1',
        title: 'tab 1'
    }, {
        name: 'tab2',
        title: 'tab 2'
    }, {
        name: 'tab3',
        title: 'tab 3'
    }],

    onTabClick (key) {
        this.setState({
            currentTabKey: key
        });
    },

    calcProgress () {
        return Math.round(Number(this.state.currentTabKey.replace(/[^0-9]*/gi, '') || 0) / 3 * 100);
    },

    render () {
        return this.template({
            state: this.state,
            content: content[this.state.currentTabKey],
            cn: cn,
            progress: this.calcProgress()
        });
    }
};
