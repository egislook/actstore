'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ActStore = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.Memo = Memo;
exports.useMemoize = useMemoize;
exports.default = useActStore;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _fetchier = require('fetchier');

var _fetchier2 = _interopRequireDefault(_fetchier);

var _jsCookie = require('js-cookie');

var _jsCookie2 = _interopRequireDefault(_jsCookie);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var init = null;
var defaultStatus = {
  loading: null,
  info: null,
  confirm: null,
  update: null
};

var ActStore = exports.ActStore = function ActStore(props) {
  var _useActStore = useActStore(props),
      act = _useActStore.act;

  (0, _react.useEffect)(function () {
    act('APP_INIT');
  }, []);
  // console.log('ACTSTORE: Init')
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

  if (triggers) {
    // noinspection JSCheckFunctionSignatures
    return children.map(function (child, index) {
      return _react2.default.useMemo(function () {
        return child;
      }, triggers ? Object.values(triggers[index]) : Object.values(child.props));
    });
  } else {
    // noinspection JSCheckFunctionSignatures
    return children.map(function (child) {
      return _react2.default.useMemo(function () {
        return child;
      }, child.props.triggers ? Object.values(child.props.triggers) : Object.values(child.props));
    });
  }
}

function useMemoize(Component, props, triggers) {
  // noinspection JSCheckFunctionSignatures
  return _react2.default.useMemo(function () {
    return _react2.default.createElement(Component, props);
  }, triggers ? Object.values(triggers) : Object.values(props));
}

function useActStore(args) {
  if (!init) {
    init = useStore(args);
    return init();
  }

  if ((typeof args === 'undefined' ? 'undefined' : _typeof(args)) === 'object') {
    var store = init();
    var actions = args.actions(store);
    if (!store.actions) store.actions = {};
    // TODO!!!
    // Add flag not to allow overwrite actions.
    // For development purpose its better to overwrite cause updated actions are getting stored even if they are with the same name.
    var firstActionName = false && Object.keys(actions).shift();
    if (store.actions[firstActionName]) return store;
    for (var actionName in actions) {
      store.actions[actionName] = actions[actionName].bind(store);
    }
    return store;
  }

  if (typeof args === 'function') {
    var _store = init();
    var _actions = args(_store);
    if (!_store.actions) _store.actions = {};
    var _firstActionName = Object.keys(_actions).shift();
    if (_store.actions[_firstActionName]) return _store;
    for (var _actionName in _actions) {
      _store.actions[_actionName] = _actions[_actionName].bind(_store);
    }
    return _store;
  }

  return init();
}

/*
    This is our useActStore() hooks
 */
function useStore(args) {
  var actions = args.actions,
      config = args.config,
      _args$init = args.init,
      init = _args$init === undefined ? {} : _args$init,
      initialState = args.initialState,
      router = args.router;

  var handlers = {
    clear: handleClear,
    confirm: handleConfirm,
    info: handleInfo,
    loading: setLoading,
    set: setGlobalHandler
  };
  var store = _extends({}, args, {
    init: _extends({}, args.init, {
      CLIENT: (typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object'
    }),
    cookies: _jsCookie2.default,
    config: config,
    handle: handlers,
    route: {
      get: getRoute,
      set: setRoute,
      match: function match(str) {
        return router.asPath.includes(str);
      }
    },
    status: _extends({}, defaultStatus, {
      loading: (typeof window === 'undefined' ? 'undefined' : _typeof(window)) !== 'object'
    }),
    store: _extends({}, initialState, {
      token: _jsCookie2.default.get('token'),
      get: getGlobal,
      set: setGlobal
    }),
    subscriptions: []
    // Give internal setState function access our store
  });store.resetState = resetState.bind(store, initialState);
  store.setState = setState.bind(store);
  store.setStatusState = setStatusState.bind(store);
  // Generate internal act object of executable actions
  if (actions) {
    store.act = act.bind(store);
    store.action = action.bind(store);
    registerActions.call(store, actions);
  }
  // Return subscribe-able hooks
  return useInternalStore.bind(store);

  function getGlobal(singleKey) {
    var keys = [].concat(Array.prototype.slice.call(arguments));
    if (!keys.length) return store.store;
    if (keys.length === 1) return store.store[singleKey];
    return keys.reduce(function (res, key) {
      return Object.assign(res, _defineProperty({}, key, store.store[key]));
    }, {});
  }

  function setGlobal(data) {
    // Add the new state into our current state
    if (data) {
      store.setState(data);
      store.setStatusState(_extends({}, defaultStatus, {
        update: new Date().getTime()
      }));
    } else {
      store.resetState();
      store.setStatusState(_extends({}, defaultStatus, {
        update: new Date().getTime()
      }));
    }
    return Promise.resolve(data);
  }

  function setGlobalHandler(handler) {
    if ((typeof handler === 'undefined' ? 'undefined' : _typeof(handler)) !== 'object') return;
    var handlerName = Object.key(handler).shift();
    handlers[handlerName] = handler[handlerName];
    return Promise.resolve(handler);
  }

  function setLoading(loading) {
    var globalStatus = _extends({}, defaultStatus, { loading: loading });
    store.status.loading !== loading && store.setStatusState(globalStatus);
  }

  function getRoute(singleKey) {

    var path = router && router.asPath && router.asPath.split('?').shift() || '';
    var routeData = {
      asPath: router.asPath,
      path: path,
      query: router.query,
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
      return resolve(router.push(name, name.pathname, { shallow: true }));
    });

    var route = init.routes[name] || {
      link: router.query.redirect || name
    };

    return new Promise(function (resolve) {
      if (disableRoute || router.asPath === (route.link || name)) return resolve(route);
      return resolve(router.push(route.link, route.link, { shallow: true }));
    });
  }

  function handleClear() {
    var update = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Date().getTime();

    store.setStatusState(_extends({}, defaultStatus, {
      update: update
    }));
  }

  function handleConfirm(action) {
    if (!action || action && typeof store.status.confirm !== 'function') return store.setStatusState(_extends({}, defaultStatus, { confirm: action }));
    store.status.confirm();
    return store.setStatusState(_extends({}, defaultStatus, { confirm: null }));
  }

  function handleInfo(data) {
    store.setStatusState(_extends({}, defaultStatus, {
      info: data && data.message || JSON.stringify(data)
    }));
  }
}

/*
    Internal setState function to manipulate store.state
    EX: store.setState({ loading: true });
 */
function resetState() {
  var _this = this;

  var initialState = arguments[0];
  this.store = _extends({}, initialState, {
    token: _jsCookie2.default.get('token'),
    get: this.store.get,
    set: this.store.set
    // Then fire all subscribed functions in our subscriptions array
  });this.subscriptions.forEach(function (subscription) {
    subscription(_this.store);
  });
}

function setState(newState) {
  var _this2 = this;

  // Add the new state into our current state
  this.store = _extends({}, this.store, newState);
  // Clears out false values in the store
  for (var key in newState) {
    if (!newState[key]) delete this.store[key];
  }
  // Then fire all subscribed functions in our subscriptions array
  this.subscriptions.forEach(function (subscription) {
    subscription(_this2.store);
  });
}

function setStatusState(newStatusState) {
  var _this3 = this;

  // Add the new state into our current state
  this.status = _extends({}, this.status, newStatusState);
  // Then fire all subscribed functions in our subscriptions array
  this.subscriptions.forEach(function (subscription) {
    subscription(_this3.status);
  });
}

function act() {
  var _this4 = this;

  var args = [].concat(Array.prototype.slice.call(arguments));
  var actionName = args.shift();
  var actions = this.actions;
  var handleError = function handleError(error) {

    actions['APP_INFO'] ? actions['APP_INFO'](error) : _this4 && _this4.handle && _this4.handle.info(error);

    throw error;
  };
  if (typeof actionName === 'function') return actionName.apply(this, arguments);
  if (typeof actionName === 'string') {
    var isAction = actions[actionName];
    var actFunction = isAction ? actions[actionName].bind(this).apply(undefined, _toConsumableArray(args)) : getRequestPromise.apply(this, arguments);

    if (actFunction instanceof Promise) return isAction ? actFunction.catch(handleError) : actFunction;else return Promise.resolve(actFunction);
  }
  if (Array.isArray(actionName)) return Promise.all(actionName.map(function (request) {
    return typeof request === 'string' ? act.bind(_this4)(request) : (typeof request === 'undefined' ? 'undefined' : _typeof(request)) === 'object' ? getRequestPromise.bind(_this4)(null, request) : request;
  }));
  return handleError(actionName + ' action is missing correct actionName as first parameter');
}

function action() {
  var args = [].concat(Array.prototype.slice.call(arguments));
  var actionName = args.shift();

  var actions = this.actions;
  if (typeof actionName !== 'string' || !actions[actionName]) return Promise.reject(actionName + ' action can not be found');
  return function () {
    return actions[actionName].apply(this, args);
  };
}

function registerActions() {
  var fn = arguments[0];
  var actions = fn(this);
  if (!this.actions) this.actions = {};
  var firstActionName = Object.keys(actions).shift();
  if (this.actions[firstActionName]) return this;
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

  console.warn(actionName, endpoint || query && query.replace(/[\n\t]/gm, '').trim().substr(0, 50) || '');
  req = _extends({
    method: actionName || req && req.method || method || 'GET',
    endpoint: req && req.endpoint || endpoint,
    path: req && req.path || path || ''
  }, req || request);
  var token = _jsCookie2.default.get('token');
  switch (req.method) {
    case 'GQL':
    case 'POST':
    case 'GET':
      var url = req.method === 'GQL' ? GQL_URL : endpoints[endpoint] + req.path;
      return _fetchier2.default[req.method](_extends({ url: url, token: token }, req));
    case 'OPEN':
      return _fetchier.WS.OPEN(_extends({ url: WSS_URL, token: token }, req), null);
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
function useInternalStore() {
  var _this5 = this;

  // Get setState function from useState
  var newSubscription = (0, _react.useState)()[1];
  (0, _react.useEffect)(function () {
    // Add setState function to our subscriptions array on component mount
    _this5.subscriptions.push(newSubscription);
    // Remove setState function from subscriptions array on component unmount
    return function () {
      if (!_this5.subscriptions) return console.log('useInternalStore', _this5);
      _this5.subscriptions = _this5.subscriptions.filter(function (subscription) {
        return subscription !== newSubscription;
      });
    };
  }, []);
  // Return subscribe-able hooks
  return this;
}