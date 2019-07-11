"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _jsCookie = require("js-cookie");

var _jsCookie2 = _interopRequireDefault(_jsCookie);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _index = require("./index");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var defaultStatus = {
  loading: null,
  info: null,
  confirm: null,
  update: null
};
/*
    This is our useActStore() hooks
 */

exports.default = function (_ref) {
  var actions = _ref.actions,
      configs = _ref.configs,
      init = _ref.init,
      initialState = _ref.initialState,
      router = _ref.router;

  var _useState = (0, _react.useState)(_extends({}, defaultStatus, {
    loading: (typeof window === "undefined" ? "undefined" : _typeof(window)) !== "object"
  })),
      _useState2 = _slicedToArray(_useState, 2),
      status = _useState2[0],
      setGlobalStatus = _useState2[1];

  var handlers = {
    loading: setLoading,
    info: handleInfo,
    clear: handleClear,
    confirm: handleConfirm,
    set: setGlobalHandler
  };
  var actStore = {
    cookies: _jsCookie2.default,
    configs: configs,
    handle: handlers,
    route: {
      router: router,
      get: function get(str) {
        return getRoute(str);
      },
      set: setRoute
    },
    status: status,
    store: _extends({}, initialState, {
      token: _jsCookie2.default.get("token"),
      get: getStoreState,
      set: setStoreState
    }),
    subscriptions: []
  };
  // Give internal setState function access our store
  actStore.setState = setState.bind(actStore);
  // Generate internal act object of executable actions
  actStore.act = act.bind(actStore);
  actStore.action = action.bind(actStore);
  //actStore.actions = registerActions(actStore, actions);
  // Other initialization
  if (init) init(actStore);
  // Return generated actStore
  //return actStore;
  return useSubscribe.bind(actStore);
  // Getter
  function getStoreState(singleKey) {
    var keys = [].concat(Array.prototype.slice.call(arguments));
    if (!keys.length) return actStore.store;
    if (keys.length === 1) return actStore.store[singleKey];
    return keys.reduce(function (res, key) {
      return Object.assign(res, _defineProperty({}, key, actStore.store[key]));
    }, {});
  }
  function getRoute(str) {
    return str ? router.asPath.includes(str) : router.asPath;
  }
  // Setter
  function setStoreState(data) {
    if (data) {
      for (var key in data) {
        actStore.store[key] = data[key];
      }
    } else actStore.store = {};
    setState.apply(actStore, !data ? {} : actStore.store);
    handleClear();
    return Promise.resolve(data);
  }
  function setRoute(name, disableRoute) {
    var route = init.routes[name] || { link: router.query.redirect || name };
    return new Promise(function (resolve) {
      if (disableRoute || router.asPath === (route.link || name)) return resolve(route);
      // router.events.on('routeChangeComplete', (url) => {
      //   router.events.off('routeChangeComplete');
      //   return resolve(url);
      // });
      return resolve(router.push(route.link, route.link, { shallow: true }));
    });
  }
  function setLoading(loading) {
    var globalStatus = _extends({}, defaultStatus, { loading: loading });
    status.loading !== loading && setGlobalStatus(globalStatus);
  }
  function setGlobalHandler(handler) {
    if ((typeof handler === "undefined" ? "undefined" : _typeof(handler)) !== 'object') return;
    var handlerName = Object.key(handler).shift();
    handlers[handlerName] = handler[handlerName];
    return Promise.resolve(handler);
  }
  // Handlers
  function handleClear() {
    var update = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Date().getTime();

    actStore.status = _extends({}, defaultStatus, { update: update });
  }
  function handleConfirm(action) {
    if (!action || action && typeof status.confirm !== "function") return setGlobalStatus(_extends({}, defaultStatus, { confirm: action }));
    status.confirm();
    return setGlobalStatus(_extends({}, defaultStatus, { confirm: null }));
  }
  function handleInfo(data) {
    return setGlobalStatus(_extends({}, defaultStatus, {
      info: data && data.message || JSON.stringify(data)
    }));
  }
};
/*
    Internal setState function to manipulate actStore.state
    EX: actStore.setState({ loading: true });
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
function act() {
  var _this2 = this;

  var args = [].concat(Array.prototype.slice.call(arguments));
  var actionName = args.shift();
  var actions = _index.GlobalProvider.actions;
  // console.log('[ACT]', actionName, args);
  var handleError = function handleError(error) {
    console.warn(error);
    return _this2 && _this2.handle && _this2.handle.info(error);
  };
  if (typeof actionName === "function") return actionName.apply(this, arguments);
  if (typeof actionName === "string") {
    var actFunction = actions[actionName] ? actions[actionName].bind(this).apply(undefined, _toConsumableArray(args)) : _index.getRequestPromise.apply(this, arguments);
    return (typeof actFunction === "undefined" ? "undefined" : _typeof(actFunction)) === "object" ? actFunction.catch(handleError) : Promise.resolve(actFunction);
  }
  if (Array.isArray(actionName)) return Promise.all(actionName.map(function (request) {
    return typeof request === "string" ? act.bind(_this2)(request) : (typeof request === "undefined" ? "undefined" : _typeof(request)) === "object" ? _index.getRequestPromise.bind(_this2)(null, request) : request;
  })).catch(handleError);
  return handleError(actionName + " action is missing correct actionName as first parameter");
}
function action(actionName) {
  var actions = this.actions;
  if (typeof actionName !== "string" || !actions[actionName]) return Promise.reject(actionName + " action can not be found");
  return function () {
    return actions[actionName].apply(this, arguments);
  };
}
/*
    Internal act object which will hold all executable actions
    EX: actStore.act.doSomething(cool);
 */
/*
function registerActions(actStore, actions) {
  const registeredActions = {};
  Object.keys(actions).forEach(key => {
    if (typeof actions[key] === "function")
      // If action is of type action we set this binding to null
      // then give it access to our actStore.
      // this will let us use actStore.setStore and chain our actStore.act
      registeredActions[key] = actions[key].bind(null, actStore);
    if (typeof actions[key] === "object")
      // If action is of type object of functions
      // we recurse our registerActions function
      // EX: { counter: { increment, decrement } }
      registeredActions[key] = registerActions(actStore, actions[key]);
  });
  return registeredActions;
}
*/
/*
    Internal useSubscribe hooks to handle component subscriptions
    when it is mounted and unmounted.
 */
function useSubscribe() {
  var _this3 = this;

  // Get setState function from useState
  // noinspection JSCheckFunctionSignatures
  var newSubscription = (0, _react.useState)()[1];
  (0, _react.useEffect)(function () {
    // Add setState function to our subscriptions array on component mount
    _this3.subscriptions.push(newSubscription);
    // Remove setState function from subscriptions array on component unmount
    return function () {
      _this3.subcriptions = _this3.subcriptions.filter(function (subscription) {
        return subscription !== newSubscription;
      });
    };
  }, []);
  return this;
}