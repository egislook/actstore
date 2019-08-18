'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ActStore = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.Memo = Memo;
exports.useMemoize = useMemoize;
exports.default = useActStore;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _fetchier = require('fetchier');

var _fetchier2 = _interopRequireDefault(_fetchier);

var _utils = require('fetchier/utils');

var _jsCookie = require('js-cookie');

var _jsCookie2 = _interopRequireDefault(_jsCookie);

var _equal = require('../utils/equal');

var _equal2 = _interopRequireDefault(_equal);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var init = null;
var debug = null;

var ActStore = exports.ActStore = function ActStore(props) {
  debug && console.log('ACTSTORE: INIT');
  if (!init) init = useStore(props);

  var _init = init(),
      act = _init.act;

  (0, _react.useEffect)(function () {
    act('APP_INIT');
  }, []);
  return null;
};

/*
  Cleaner function to memoize child components,
  only state change in the props will cause a re-render
  EX: useMemoize(Component, props);
 */
function Memo(_ref) {
  var children = _ref.children,
      triggers = _ref.triggers;

  //triggers && Object.values(triggers)) || child.props.triggers ? Object.values(child.props.triggers) : 
  return _react2.default.Children.map(children, function (child) {
    return _react2.default.useMemo(function () {
      return child;
    }, triggers ? Object.values(triggers) : Object.values(child.props));
  });
}

function useMemoize(Component, props, triggers) {
  return _react2.default.useMemo(function () {
    return _react2.default.createElement(Component, props);
  }, triggers ? Object.values(triggers) : Object.values(props));
}

function useActStore(args, watch) {

  var watcher = { watch: watch, name: args && args.name };
  var store = init(watcher);
  useInternalStore.call(store, watcher);

  if ((typeof args === 'undefined' ? 'undefined' : _typeof(args)) === 'object') {
    if (!args.actions) return store;
    var actions = args.actions(store);
    if (!store.actions) store.actions = {};
    for (var actionName in actions) {
      store.actions[actionName] = actions[actionName].bind(store);
    }

    return store;
  }

  if (typeof args === 'function') {
    var _actions = args(store);
    if (!store.actions) store.actions = {};
    var firstActionName = Object.keys(_actions).shift();
    if (store.actions[firstActionName]) return store;
    for (var _actionName in _actions) {
      store.actions[_actionName] = _actions[_actionName].bind(store);
    }
    return store;
  }

  return init();
}

/*
    This is our useActStore() hooks
 */
function useStore() {
  var args = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var actions = args.actions,
      config = args.config,
      _args$init = args.init,
      init = _args$init === undefined ? {} : _args$init,
      initialState = args.initialState,
      router = args.router;

  var store = _extends({}, args, {
    init: _extends({}, args.init, {
      CLIENT: (typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object'
    }),
    cookies: _jsCookie2.default,
    config: config,
    route: {
      get: getRoute,
      set: setRoute,
      match: function match(str) {
        return router && router.asPath.includes(str);
      }
    },
    store: _extends({}, initialState, {
      get: getGlobal,
      set: setGlobal
    }),
    subscriptions: []
    // Give internal setState function access our store
  });store.resetState = resetState.bind(store, initialState);
  store.setState = setState.bind(store);
  // Generate internal act object of executable actions
  if (actions) {
    store.act = act.bind(store);
    store.action = action.bind(store);
    registerActions.call(store, actions);
  }
  // Return subscribe-able hooks
  return function () {
    return store;
  };

  function getGlobal(singleKey) {
    var keys = [].concat(Array.prototype.slice.call(arguments));
    if (!keys.length) return store.store;
    if (keys.length === 1) return store.store[singleKey];
    return keys.reduce(function (res, key) {
      return Object.assign(res, _defineProperty({}, key, store.store[key]));
    }, {});
  }

  function setGlobal(data) {
    data ? store.setState(data) : store.resetState();
    return Promise.resolve(data);
  }

  function getRoute(singleKey) {

    var path = router && router.asPath && router.asPath.split('?').shift() || '';
    var routeData = {
      asPath: router && router.asPath,
      path: path,
      query: router && router.query,
      params: path.split('/').filter(function (val) {
        return val.length;
      })
    };

    var keys = [].concat(Array.prototype.slice.call(arguments));
    if (!keys.length) return routeData;
    if (keys.length === 1) return routeData[singleKey];
    return keys.reduce(function (res, key) {
      return Object.assign(res, _defineProperty({}, key, routeData[key]));
    }, {});
  }

  function setRoute(name, disableRoute) {
    if ((typeof name === 'undefined' ? 'undefined' : _typeof(name)) === 'object') return new Promise(function (resolve) {
      return resolve(router && router.push(name, name.pathname, { shallow: true }));
    });

    var route = init.routes[name] || {
      link: router.query.redirect || name
    };

    return new Promise(function (resolve) {
      if (disableRoute || router && router.asPath === (route.link || name)) return resolve(route);
      return resolve(router && router.push(route.link, route.link, { shallow: true }));
    });
  }
}

/*
    Internal setState function to manipulate store.state
    EX: store.setState({ loading: true });
 */
function resetState(initialState) {
  var _this = this;

  this.store = _extends({}, initialState, {
    get: this.store.get,
    set: this.store.set
    // Then fire all subscribed functions in our subscriptions array
  });this.subscriptions.forEach(function (subscription) {
    subscription.setWatcher(_this.store);
  });
}

function setState(newState) {
  var _this2 = this;

  // Add the new state into our current state

  // console.log(equal(newState, this.store), newState)
  debug && console.log('ACTSTORE: set', newState);
  var stateKeys = Object.keys(newState);
  this.store = _extends({}, this.store, newState);
  // Clears out false values in the store
  for (var key in stateKeys) {
    if (!newState[key]) delete this.store[key];
  }
  // Then fire all subscribed functions in our subscriptions array
  this.subscriptions.forEach(function (subscription) {
    if (!subscription.watch) return subscription.setWatcher(_this2.store);

    if (!subscription.watch.length) return;

    if (subscription.watch.find(function (key) {
      return stateKeys.includes(key);
    })) return subscription.setWatcher(_this2.store);
  });
}

function act() {
  var _this3 = this;

  var args = [].concat(Array.prototype.slice.call(arguments));
  var actionName = args.shift();
  var actions = this.actions;
  var handleError = function handleError(error) {

    actions['APP_INFO'] ? actions['APP_INFO'](error) : _this3 && _this3.handle && _this3.handle.info(error);

    throw error;
  };

  if (typeof actionName === 'function') return actionName.apply(this, arguments);
  if (typeof actionName === 'string') {
    var isAction = actions[actionName];
    var actFunction = isAction ? actions[actionName].bind(this).apply(undefined, _toConsumableArray(args)) : getRequestPromise.apply(this, arguments);

    if (actFunction instanceof Promise) return isAction ? actFunction.catch(handleError) : actFunction;else return Promise.resolve(actFunction);
  }
  if (Array.isArray(actionName)) return Promise.all(actionName.map(function (request) {
    return typeof request === 'string' ? act.bind(_this3)(request) : (typeof request === 'undefined' ? 'undefined' : _typeof(request)) === 'object' ? getRequestPromise.bind(_this3)(null, request) : request;
  }));
  return handleError(actionName + ' action is missing correct actionName as first parameter');
}

function action() {
  var args = [].concat(Array.prototype.slice.call(arguments));
  var actionName = args.shift();

  var actions = this.actions;
  if (typeof actionName !== 'string' || !actions[actionName]) return Promise.reject(actionName + ' action can not be found');
  return function () {
    return actions[actionName].apply(this, args.length ? args : arguments);
  };
}

function registerActions() {
  var fn = arguments[0];
  var actions = fn(this);
  if (!this.actions) this.actions = {};
  // const firstActionName = Object.keys(actions).shift()
  // if (this.actions[firstActionName]) return this
  // Always update actions for now
  for (var actionName in actions) {
    this.actions[actionName] = actions[actionName].bind(this.set);
  }
  return this;
}

function getRequestPromise(actionName, request) {
  var _ref2 = request || {},
      method = _ref2.method,
      endpoint = _ref2.endpoint,
      path = _ref2.path,
      req = _ref2.req,
      query = _ref2.query;

  var _ref3 = this.config || {},
      GQL_URL = _ref3.GQL_URL,
      WSS_URL = _ref3.WSS_URL,
      endpoints = _ref3.endpoints;

  debug && console.warn(actionName, request);
  req = _extends({
    method: actionName || req && req.method || method || 'GET',
    endpoint: req && req.endpoint || endpoint,
    path: req && req.path || path || ''
  }, req || request);
  var token = _jsCookie2.default.get('token');
  switch (req.method) {
    case 'POST':
    case 'GET':
      return _fetchier2.default[req.method](_extends({ url: endpoints[endpoint] + req.path, token: token }, req));
    case 'GQL':
      if (!req.upsert && !req.data) return _fetchier2.default[req.method](_extends({ url: GQL_URL, token: token }, req));

      var upsertRequest = (0, _utils.upsert)(_extends({ data: req.upsert }, req));
      if (!upsertRequest) return Promise.resolve('Nothing to change. Data is the same as Prev');
      return _fetchier2.default[req.method](_extends({ url: GQL_URL, token: token }, req, upsertRequest));
    case 'OPEN':
      var onError = req.onError || this.actions['APP_INFO'];
      return _fetchier.WS.OPEN(_extends({ url: WSS_URL, token: token }, req, { onError: onError }), null);
    case 'CLOSE':
      return _fetchier.WS.CLOSE(_extends({ url: WSS_URL }, req));
    case 'PUT':
      return (0, _fetchier.PUT)(_extends({}, req));
    case 'SUB':
      return _fetchier.WS.SUB({ url: req.url || WSS_URL, subscription: req });
    case 'UNSUB':
      return _fetchier.WS.UNSUB(_extends({ url: WSS_URL }, req));
  }
  return Promise.reject('Incorrect action ' + actionName);
}

/*
    Internal useInternalStore hooks to handle component subscriptions
    when it is mounted and unmounted.
 */
function useInternalStore(_ref4) {
  var _this4 = this;

  var name = _ref4.name,
      watch = _ref4.watch;

  // Get setState function from useState
  var _useState = (0, _react.useState)(watch),
      _useState2 = _slicedToArray(_useState, 2),
      setWatcher = _useState2[1];

  var _useState3 = (0, _react.useState)(name || Date.now() + Math.random()),
      _useState4 = _slicedToArray(_useState3, 1),
      componentId = _useState4[0];

  (0, _react.useEffect)(function () {
    debug && console.log('ACTSTORE: hooked to', componentId);
    // Add setState function to our subscriptions array on component mount
    _this4.subscriptions.push({ watch: watch, setWatcher: setWatcher, name: name, componentId: componentId });
    // Remove setState function from subscriptions array on component unmount
    return function () {
      if (!_this4.subscriptions) return console.error('ACTSTORE: missing store subscriptions to unsubscribe');
      debug && console.log('ACTSTORE: unhooked from', name || 'unknown');
      _this4.subscriptions = _this4.subscriptions.filter(function (subscription) {
        return subscription.setWatcher !== setWatcher;
      });
    };
  }, []);
  // Return subscribe-able hooks
  return this;
}