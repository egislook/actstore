"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ActStore = void 0;
exports.Memo = Memo;
exports["default"] = useActStore;
exports.useMemoize = useMemoize;

var _react = _interopRequireWildcard(require("react"));

var _fetchier = _interopRequireWildcard(require("fetchier"));

var _utils = require("fetchier/utils");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

var init,
    debug,
    Cookies = {
  get: console.log,
  set: console.log
},
    handlers;

var ActStore = function ActStore() {
  var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  debug = props.debug;
  debug && console.log('ACTSTORE: INIT');
  if (!init) init = useStore(props);
  var store = init();
  return store;
};
/*
  Cleaner function to memoize child components,
  only state change in the props will cause a re-render
  EX: useMemoize(Component, props);
 */


exports.ActStore = ActStore;

function Memo(_ref) {
  var children = _ref.children,
      triggers = _ref.triggers;
  //triggers && Object.values(triggers)) || child.props.triggers ? Object.values(child.props.triggers) :
  return _react["default"].Children.map(children, function (child) {
    return _react["default"].useMemo(function () {
      return child;
    }, triggers ? Object.values(triggers) : Object.values(child.props));
  });
}

function useMemoize(Component, props, triggers) {
  return _react["default"].useMemo(function () {
    return /*#__PURE__*/_react["default"].createElement(Component, props);
  }, triggers ? Object.values(triggers) : Object.values(props));
}

function useActStore(args, watch) {
  if (args !== null && args !== void 0 && args.debug) debug = args.debug;

  if (!init) {
    Cookies = (args === null || args === void 0 ? void 0 : args.cookies) || (args === null || args === void 0 ? void 0 : args.Cookies) || Cookies;
    handlers = (args === null || args === void 0 ? void 0 : args.handlers) || {};
    init = useStore(args);
  }

  var watcher = {
    watch: watch,
    name: args && args.name
  };
  var store = init(watcher);
  useInternalStore.call(store, watcher);

  if (_typeof(args) === 'object') {
    if (!args.actions) return store;
    var actions = args.actions(store);
    if (!store.actions) store.actions = {};

    for (var actionName in actions) {
      store.actions[actionName] = actions[actionName].bind(store);
    }
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

  return store;
}
/*
    This is our useActStore() hooks
 */


function useStore() {
  var args = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var _ref2 = args || {},
      actions = _ref2.actions,
      configs = _ref2.configs,
      config = _ref2.config,
      _ref2$init = _ref2.init,
      init = _ref2$init === void 0 ? {} : _ref2$init,
      initialState = _ref2.initialState,
      router = _ref2.router;

  var store = _objectSpread(_objectSpread({}, args), {}, {
    init: _objectSpread(_objectSpread({}, args.init), {}, {
      CLIENT: (typeof window === "undefined" ? "undefined" : _typeof(window)) === 'object'
    }),
    handlers: handlers,
    cookies: Cookies,
    configs: configs || config,
    config: config,
    route: {
      get: getRoute,
      set: setRoute,
      match: function match(str) {
        return router && router.asPath.includes(str);
      }
    },
    store: _objectSpread(_objectSpread({}, initialState), {}, {
      get: getGlobal,
      set: setGlobal
    }),
    subscriptions: []
  }); // Give internal setState function access our store


  store.resetState = resetState.bind(store, initialState);
  store.setState = setState.bind(store); // Generate internal act object of executable actions

  store.act = act.bind(store);
  store.action = action.bind(store);
  registerActions.call(store, actions);
  store.handle = handlers && Object.keys(handlers).reduce(function (obj, key) {
    obj[key] = typeof handlers[key] === 'string' ? actions[handlers[key]] : handlers[key];
    return obj;
  }, {}); // Return subscribe-able hooks

  return function () {
    return store;
  };

  function getGlobal(singleKey) {
    var keys = Array.prototype.slice.call(arguments);
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
    var keys = Array.prototype.slice.call(arguments);
    if (!keys.length) return routeData;
    if (keys.length === 1) return routeData[singleKey] || routeData.params && routeData.params.includes(singleKey);
    return keys.reduce(function (res, key) {
      return Object.assign(res, _defineProperty({}, key, routeData[key]));
    }, {});
  }

  function setRoute(name, disableRoute) {
    if (_typeof(name) === 'object') return new Promise(function (resolve) {
      return resolve(router && router.push(name, name.pathname, {
        shallow: true
      }));
    });
    var route = init.routes[name] || {
      link: router.query.redirect || name
    };
    return new Promise(function (resolve) {
      if (disableRoute || router && router.asPath === (route.link || name)) return resolve(route);
      return resolve(router && router.push(route.link, route.link, {
        shallow: true
      }));
    });
  }
}
/*
    Internal setState function to manipulate store.state
    EX: store.setState({ loading: true });
 */


function resetState(initialState) {
  var _this = this;

  this.store = _objectSpread(_objectSpread({}, initialState), {}, {
    get: this.store.get,
    set: this.store.set
  }); // Then fire all subscribed functions in our subscriptions array

  this.subscriptions.forEach(function (subscription) {
    subscription.setWatcher(_this.store);
  });
}

function setState(newState) {
  var _this2 = this;

  // Add the new state into our current state
  // console.log(equal(newState, this.store), newState)
  var stateKeys = Object.keys(newState);
  if (!stateKeys.length) return debug && console.log('ACTSTORE ERROR: set accepts only objects');
  debug && console.log('ACTSTORE: set', newState);
  this.store = _objectSpread(_objectSpread({}, this.store), newState); // Clears out false values in the store

  for (var key in stateKeys) {
    if (!newState[key]) delete this.store[key];
  } // Then fire all subscribed functions in our subscriptions array


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

  var args = Array.prototype.slice.call(arguments);
  var actionName = args.shift();
  var actions = this.actions;

  var handleError = function handleError(error) {
    actions['APP_INFO'] ? actions['APP_INFO'](error) : _this3 && _this3.handle && _this3.handle.info(error);
    throw error;
  };

  if (typeof actionName === 'function') return actionName.apply(this, arguments);

  if (typeof actionName === 'string') {
    var isAction = actions[actionName];
    var actFunction = isAction ? actions[actionName].bind(this).apply(void 0, _toConsumableArray(args)) : getRequestPromise.apply(this, arguments);
    if (actFunction instanceof Promise) return isAction ? actFunction["catch"](handleError) : actFunction;else return Promise.resolve(actFunction);
  }

  if (Array.isArray(actionName)) return Promise.all(actionName.map(function (request) {
    return typeof request === 'string' ? act.bind(_this3)(request) : _typeof(request) === 'object' ? getRequestPromise.bind(_this3)(null, request) : request;
  }));
  return handleError(actionName + ' action is missing correct actionName as first parameter');
}

function action() {
  var args = Array.prototype.slice.call(arguments);
  var actionName = args.shift();
  var actions = this.actions;
  if (typeof actionName !== 'string' || !actions[actionName]) return Promise.reject(actionName + ' action can not be found');
  return function () {
    return actions[actionName].apply(this, args.length ? args : arguments);
  };
}

function registerActions() {
  var fn = arguments[0];
  this.actions = this.actions || {};

  if (!fn) {
    debug && console.log('ACTSTORE ERROR:', 'No actions been stored');
    return this;
  }

  var actions = fn(this);
  if (!this.actions) this.actions = {}; // const firstActionName = Object.keys(actions).shift()
  // if (this.actions[firstActionName]) return this
  // Always update actions for now

  for (var actionName in actions) {
    this.actions[actionName] = actions[actionName].bind(this.set);
  }

  return this;
}

function getRequestPromise(_x, _x2) {
  return _getRequestPromise.apply(this, arguments);
}
/*
    Internal useInternalStore hooks to handle component subscriptions
    when it is mounted and unmounted.
 */


function _getRequestPromise() {
  _getRequestPromise = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(actionName, request) {
    var _ref4, method, endpoint, path, req, query, _ref5, GQL_URL, WSS_URL, endpoints, token, upsertRequest, onError;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _ref4 = request || {}, method = _ref4.method, endpoint = _ref4.endpoint, path = _ref4.path, req = _ref4.req, query = _ref4.query;
            _ref5 = this.configs || {}, GQL_URL = _ref5.GQL_URL, WSS_URL = _ref5.WSS_URL, endpoints = _ref5.endpoints;
            debug && console.warn(actionName, request);
            req = _objectSpread({
              method: actionName || req && req.method || method || 'GET',
              endpoint: req && req.endpoint || endpoint,
              path: req && req.path || path || ''
            }, req || request);
            _context.next = 6;
            return Cookies.get('token');

          case 6:
            token = _context.sent;
            _context.t0 = req.method;
            _context.next = _context.t0 === 'POST' ? 10 : _context.t0 === 'GET' ? 10 : _context.t0 === 'DELETE' ? 10 : _context.t0 === 'PUT' ? 10 : _context.t0 === 'GQL' ? 11 : _context.t0 === 'OPEN' ? 17 : _context.t0 === 'CLOSE' ? 19 : _context.t0 === 'SUB' ? 20 : _context.t0 === 'UNSUB' ? 21 : 22;
            break;

          case 10:
            return _context.abrupt("return", _fetchier["default"][req.method](_objectSpread({
              url: endpoints[endpoint] + req.path,
              token: token
            }, req)));

          case 11:
            if (!(!req.upsert && !req.data)) {
              _context.next = 13;
              break;
            }

            return _context.abrupt("return", _fetchier["default"][req.method](_objectSpread({
              url: GQL_URL,
              token: token
            }, req)));

          case 13:
            upsertRequest = (0, _utils.upsert)(_objectSpread({
              data: req.upsert
            }, req));

            if (upsertRequest) {
              _context.next = 16;
              break;
            }

            return _context.abrupt("return", Promise.resolve('Nothing to change. Data is the same as Prev'));

          case 16:
            return _context.abrupt("return", _fetchier["default"][req.method](_objectSpread(_objectSpread({
              url: GQL_URL,
              token: token
            }, req), upsertRequest)));

          case 17:
            onError = req.onError || this.actions['APP_INFO'];
            return _context.abrupt("return", _fetchier.WS.OPEN(_objectSpread(_objectSpread({
              url: WSS_URL,
              token: token
            }, req), {}, {
              onError: onError
            }), null));

          case 19:
            return _context.abrupt("return", _fetchier.WS.CLOSE(_objectSpread({
              url: WSS_URL
            }, req)));

          case 20:
            return _context.abrupt("return", _fetchier.WS.SUB({
              url: req.url || WSS_URL,
              subscription: req
            }));

          case 21:
            return _context.abrupt("return", _fetchier.WS.UNSUB(_objectSpread({
              url: WSS_URL
            }, req)));

          case 22:
            return _context.abrupt("return", Promise.reject('Incorrect action ' + actionName));

          case 23:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _getRequestPromise.apply(this, arguments);
}

function useInternalStore(_ref3) {
  var _this4 = this;

  var name = _ref3.name,
      watch = _ref3.watch;

  // Get setState function from useState
  var _useState = (0, _react.useState)(watch),
      _useState2 = _slicedToArray(_useState, 2),
      watchers = _useState2[0],
      setWatcher = _useState2[1];

  var _useState3 = (0, _react.useState)(name || Date.now() + Math.random()),
      _useState4 = _slicedToArray(_useState3, 1),
      componentId = _useState4[0];

  (0, _react.useEffect)(function () {
    debug && console.log('ACTSTORE: hooked to', componentId); // Add setState function to our subscriptions array on component mount

    _this4.subscriptions.push({
      watch: watch,
      setWatcher: setWatcher,
      name: name,
      componentId: componentId
    }); // Remove setState function from subscriptions array on component unmount


    return function () {
      debug && console.log('Actstore', 'unmounting internal store'); // return

      if (!_this4.subscriptions) return console.error('ACTSTORE: missing store subscriptions to unsubscribe');
      debug && console.log('ACTSTORE: unhooked from', name || 'unknown');
      _this4.subscriptions = _this4.subscriptions.filter(function (subscription) {
        return subscription.setWatcher !== setWatcher;
      });
    };
  }, []); // Return subscribe-able hooks

  return this;
}