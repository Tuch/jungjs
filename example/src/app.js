const Jung = require('index.js');
const index = require('./index.html');
const bootstrap = require('./bootstrap-module.js');
const App = require('./components/App/App');

let app = Jung.render('<App></App>', document.getElementById('app'));
