import cn from './Section.css';

export default {
    name: 'Section',

    template: require('./Section.jst'),

    propTypes: {
        title: String
    },

    render () {
        return this.template({state: this.state, props: this.props, cn: cn});
    }
};
