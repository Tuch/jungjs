# JungJS
[![GitHub version](https://badge.fury.io/gh/Tuch%2Fjungjs.svg)](https://badge.fury.io/gh/Tuch%2Fjungjs)
[![Davis Dependency status](https://david-dm.org/Tuch/jungjs.svg)](https://badge.fury.io/gh/Tuch%2Fjungjs)
[![experimental](http://hughsk.github.io/stability-badges/dist/experimental.svg)](http://github.com/hughsk/stability-badges)


Reactjs API es5 implementation based on [virtual-dom](https://github.com/Matt-Esch/virtual-dom).
Completely support original life cycle and following hooks:
- componentWillMount
- componentDidMount
- componentWillUpdate
- componentDidUpdate
- componentWillUnmount
- componentWillReceiveProps
- getChildContext
- getInitialState
- getDefaultProps
- shouldComponentUpdate
- render of course!

and following methods:
- setState
- replaceState
- forceUpdate


Support lite version of propTypes (only native js types like Function, Array and etc.)
Instead JSX uses raw HTML

It is completely work version and now uses in production

es2015 [basic demo](http://tuch.github.io/jungjs/example/build/index.html)

