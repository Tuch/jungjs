const Jung = require('index.js');
const Header = require('./Header/Header');

Jung.component('App', {
    template: require('./App.jst'),

    render () {
        return this.template();
    }
});
