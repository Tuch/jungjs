var Jung = require('index.js');
var index = require('./index.html');
var bootstrap = require('./bootstrap-module.js');
var App = require('./components/App/App');

Jung.render(App, document.getElementById('app'), {
    greeting: 'Hello world!'
});
