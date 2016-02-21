import template from './ProgressBar.jst';

export default {
    name: 'ProgressBar',

    template: template,

    propTypes: {
        value: Number
    },

    getDefaultProps () {
        return {
            value: 0
        };
    },

    render () {
        return this.template(this.props);
    }
};
