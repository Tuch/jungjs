import template from './App.jst'
import Header from './Header/Header';
import TabsExample from './TabsExample/TabsExample';
import Section from './Section/Section'

export default {
    name: 'App',

    template: template,

    childrens: {
        Header: Header,
        TabsExample: TabsExample,
        Section: Section
    },

    render () {
        return this.template();
    }
};
