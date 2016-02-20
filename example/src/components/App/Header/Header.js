const Jung = require('index.js');

Jung.component('Header', {
    template: require('./Header.jst'),

    render () {
        return this.template();
    }
});
