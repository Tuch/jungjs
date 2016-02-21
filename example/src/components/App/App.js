module.exports = {
    name: 'App',

    template: require('./App.jst'),

    childrens: {
        Header: require('./Header/Header')
    },

    render () {
        return this.template(this.state);
    }
};
