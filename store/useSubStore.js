"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useInternalStore = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _jsCookie = require("js-cookie");

var _jsCookie2 = _interopRequireDefault(_jsCookie);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var DEFAULT_STATUS = {
  loading: null,
  info: null,
  confirm: null,
  update: null
};

/*
    This is our useActStore() hooks
 */
function useSubStore(props, _ref) {
  var subAct = _ref.subAct,
      subAction = _ref.subAction;
  var actions = props.actions,
      config = props.config,
      init = props.init,
      router = props.router;

  var handlers = {
    clear: handleClear,
    confirm: handleConfirm,
    info: handleInfo,
    loading: setLoading,
    set: setGlobalHandler
  };

  var _useState = (0, _react.useState)({ token: _jsCookie2.default.get("token") }),
      _useState2 = _slicedToArray(_useState, 2),
      global = _useState2[0],
      setGlobalStatus = _useState2[1];

  var _useState3 = (0, _react.useState)(_extends({}, DEFAULT_STATUS, {
    loading: (typeof window === "undefined" ? "undefined" : _typeof(window)) !== "object"
  })),
      _useState4 = _slicedToArray(_useState3, 2),
      status = _useState4[0],
      setGlobalStore = _useState4[1];

  var store = _extends({}, props, {
    cookies: _jsCookie2.default,
    config: config,
    handle: handlers,
    router: router,
    route: {
      get: function get(str) {
        return str ? router.asPath.includes(str) : router.asPath;
      },
      set: setRoute
    },
    status: status,
    store: _extends({}, global, {
      get: getStore,
      set: setStore
    }),
    subscriptions: []
  });
  // Give internal setState function access our store
  store.setState = setState.bind(store);
  // Generate internal act object of executable actions
  store.act = subAct.bind(store);
  store.action = subAction.bind(store);
  // noinspection JSCheckFunctionSignatures
  registerActions.call(store, actions);
  // Return generated store
  return useInternalStore.bind(store);
  // Getters
  function getStore(singleKey) {
    var keys = [].concat(Array.prototype.slice.call(arguments));
    if (!keys.length) return global;
    if (keys.length === 1) return global[singleKey];
    return keys.reduce(function (res, key) {
      return Object.assign(res, _defineProperty({}, key, global[key]));
    }, {});
  }
  // Setters
  function setGlobalHandler(handler) {
    if ((typeof handler === "undefined" ? "undefined" : _typeof(handler)) !== "object") return;
    var handlerName = Object.key(handler).shift();
    handlers[handlerName] = handler[handlerName];
    return Promise.resolve(handler);
  }
  function setLoading(loading) {
    var globalStatus = _extends({}, defaultStatus, { loading: loading });
    status.loading !== loading && setGlobalStatus(globalStatus);
  }
  function setRoute(name, disableRoute) {
    var route = init.routes[name] || { link: router.query.redirect || name };
    return new Promise(function (resolve) {
      if (disableRoute || router.asPath === (route.link || name)) return resolve(route);
      return resolve(router.push(route.link, route.link, { shallow: true }));
    });
  }
  function setStore(data) {
    if (data) {
      for (var key in data) {
        // noinspection JSUnfilteredForInLoop
        global[key] = data[key];
      }
    } else global = {};
    setGlobalStore(!data ? {} : global);
    store.store = _extends({}, store.store, data);
    store.subscriptions.forEach(function (subscription) {
      subscription(store.store);
    });
    handleClear();
    return Promise.resolve(data);
  }
  // Handlers
  function handleClear() {
    var update = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Date().getTime();

    setGlobalStatus(_extends({}, DEFAULT_STATUS, { update: update }));
  }
  function handleConfirm(action) {
    if (!action || action && typeof status.confirm !== "function") return setGlobalStatus(_extends({}, DEFAULT_STATUS, { confirm: action }));
    status.confirm();
    return setGlobalStatus(_extends({}, DEFAULT_STATUS, { confirm: null }));
  }
  function handleInfo(data) {
    return setGlobalStatus(_extends({}, DEFAULT_STATUS, {
      info: data && data.message || JSON.stringify(data)
    }));
  }
}
/*
    Internal setState function to manipulate store.state
    EX: store.setState({ loading: true });
 */
function setState(newState) {
  var _this = this;

  // Add the new state into our current state
  this.store = _extends({}, this.store, newState);
  // Then fire all subscribed functions in our subscriptions array
  this.subscriptions.forEach(function (subscription) {
    subscription(_this.store);
  });
}
function registerActions() {
  var state = this || {};
  var actions = arguments[0](state);
  if (!this.actions) this.actions = {};
  var firstActionName = Object.keys(actions).shift();
  if (this.actions[firstActionName]) return state;
  for (var actionName in actions) {
    // noinspection JSUnfilteredForInLoop
    this.actions[actionName] = actions[actionName].bind(state.set);
  }
  return state;
}
/*
    Internal useInternalStore hooks to handle component subscriptions
    when it is mounted and unmounted.
 */
function useInternalStore() {
  var store = this;
  // Get setState function from useState
  // noinspection JSCheckFunctionSignatures
  var newSubscription = (0, _react.useState)()[1];
  (0, _react.useEffect)(function () {
    store.act("APP_INIT");
  }, [store.cookies.get("token")]);
  (0, _react.useEffect)(function () {
    // Add setState function to our subscriptions array on component mount
    store.subscriptions.push(newSubscription);
    // Remove setState function from subscriptions array on component unmount
    return function () {
      try {
        store.subcriptions = store.subcriptions.filter(function (subscription) {
          return subscription !== newSubscription;
        });
      } catch (e) {
        console.log(e);
      }
    };
  }, []);
  // Return back our whole store
  return store;
}

exports.useInternalStore = useInternalStore;
exports.default = useSubStore;