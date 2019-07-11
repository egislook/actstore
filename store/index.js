"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
// import queries from '../data/graphqlQueries';


exports.GlobalProvider = GlobalProvider;
exports.useSubscription = useSubscription;
exports.useSubscribe = useSubscribe;
exports.usePerform = usePerform;
exports.useActStore = useActStore;
exports.useMemoize = useMemoize;
exports.Memo = Memo;
exports.useActions = useActions;
exports.useGlobal = useGlobal;
exports.act = act;
exports.action = action;
exports.getRequestPromise = getRequestPromise;

var _fetchier = require("fetchier");

var _fetchier2 = _interopRequireDefault(_fetchier);

var _jsCookie = require("js-cookie");

var _jsCookie2 = _interopRequireDefault(_jsCookie);

var _useStore = require("./useStore");

var _useStore2 = _interopRequireDefault(_useStore);

var _useSubStore = require("./useSubStore");

var _useSubStore2 = _interopRequireDefault(_useSubStore);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var context = void 0;
var initSubscription = void 0;

var createContext = _react2.default.createContext,
    useContext = _react2.default.useContext,
    useState = _react2.default.useState,
    useEffect = _react2.default.useEffect;

context = context || createContext(null);

function GlobalProvider(props) {
  var children = props.children;

  var value = (0, _useStore2.default)(props, { act: act, useActions: useActions, action: action });
  // return <context.Provider value={value} children={children} />
  return _react2.default.createElement(context.Provider, { children: children, value: value });
}

/*
  Use this at root level component to initialize global store
  @actions|Array is required

  EX: App.js
  useSubscription({ actions: [], initialState: { test: "Test" }});
 */
function useSubscription(props) {
  initSubscription = (0, _useSubStore2.default)(props);
  return initSubscription;
}

/*
  Use this to subscribe any component to global store

  EX: Component.js
  const actStore = useSubscribe();
  const { act, store } = actStore;
  console.log(store.test);
 */
function useSubscribe() {
  return initSubscription();
}

function usePerform(fn, store) {
  var initSubscription = (0, _useSubStore2.default)({ actions: fn });
  var actStore = initSubscription();
  var state = store || actStore || {};
  var actions = fn(state);
  if (!actStore.actions) actStore.actions = {};
  var firstActionName = Object.keys(actions).shift();
  if (actStore.actions[firstActionName]) return state;
  for (var actionName in actions) {
    actStore.actions[actionName] = actions[actionName].bind(state.set);
  }
  return state;
}

/*
  One Hooks To Rule Them ALL :D
 */
function useActStore(args) {
  if ((typeof args === "undefined" ? "undefined" : _typeof(args)) === "object") {
    // Initialize stage
    console.log("useActStore args is object");
    initSubscription = (0, _useSubStore2.default)(args);
    return initSubscription;
  } else if (typeof args === "function") {
    // useActions
    console.log("useActStore args is function");
    var _initSubscription = (0, _useSubStore2.default)({ actions: args });
    var actStore = _initSubscription();
    var state = actStore || {};
    var actions = args(state);
    if (!actStore.actions) actStore.actions = {};
    var firstActionName = Object.keys(actions).shift();
    if (actStore.actions[firstActionName]) return state;
    for (var actionName in actions) {
      actStore.actions[actionName] = actions[actionName].bind(state.set);
    }
    return state;
  } else {
    // useGlobal
    console.log("useActStore without argument");
    return initSubscription();
  }
}

/*
  Cleaner function to memoize child components,
  only state change in the props will cause a re-render

  EX: useMemoize(Component, props);
 */
function useMemoize(Component, props, triggers) {
  // noinspection JSCheckFunctionSignatures
  return _react2.default.useMemo(function () {
    return _react2.default.createElement(Component, props);
  }, triggers ? Object.values(triggers) : Object.values(props));
}

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

GlobalProvider.context = context;

exports.default = {
  // act,
  getRequestPromise: getRequestPromise,
  GlobalProvider: GlobalProvider,
  useActions: useActions,
  useGlobal: useGlobal
  // action
};

// Hooks

function useActions(fn, globalContext) {
  var state = globalContext || useContext(context) || {};
  var actions = fn(state);

  if (!GlobalProvider.actions) GlobalProvider.actions = {};

  var firstActionName = Object.keys(actions).shift();
  if (GlobalProvider.actions[firstActionName]) return state;

  for (var actionName in actions) {
    GlobalProvider.actions[actionName] = actions[actionName].bind(state.set);
  }

  return state;
}

function useGlobal() {
  var cfg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var actions = cfg.actions;

  var globalContext = useContext(context);

  if (actions) useActions(actions, globalContext);
  return globalContext;
}

// triggers

function act() {
  var _this = this;

  var args = [].concat(Array.prototype.slice.call(arguments));
  var actionName = args.shift();
  var actions = GlobalProvider.actions;

  // console.log('[ACT]', actionName, args);

  var handleError = function handleError(error) {
    console.warn(error);
    return _this && _this.handle && _this.handle.info(error);
  };

  if (typeof actionName === "function") return actionName.apply(this, arguments);

  if (typeof actionName === "string") {
    var actFunction = actions[actionName] ? actions[actionName].bind(this).apply(undefined, _toConsumableArray(args)) : getRequestPromise.apply(this, arguments);
    return (typeof actFunction === "undefined" ? "undefined" : _typeof(actFunction)) === "object" ? actFunction.catch(handleError) : Promise.resolve(actFunction);
  }

  if (Array.isArray(actionName)) return Promise.all(actionName.map(function (request) {
    return typeof request === "string" ? act.bind(_this)(request) : (typeof request === "undefined" ? "undefined" : _typeof(request)) === "object" ? getRequestPromise.bind(_this)(null, request) : request;
  })).catch(handleError);

  return handleError(actionName + " action is missing correct actionName as first parameter");
}

function action(actionName) {
  var actions = GlobalProvider.actions;

  if (typeof actionName !== "string" || !actions[actionName]) return Promise.reject(actionName + " action can not be found");

  return function () {
    return actions[actionName].apply(this, arguments);
  };
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

  console.warn(actionName, endpoint || query && query.replace(/[\n\t]/gm, "").trim().substr(0, 50) || "");

  req = _extends({
    method: actionName || req && req.method || method || "GET",
    endpoint: req && req.endpoint || endpoint,
    path: req && req.path || path || ""
  }, req || request);

  var token = _jsCookie2.default.get("token");

  switch (req.method) {
    case "GQL":
    case "POST":
    case "GET":
      var url = req.method === "GQL" ? GQL_URL : endpoints[endpoint] + req.path;
      return _fetchier2.default[req.method](_extends({ url: url, token: token }, req));
    case "OPEN":
      return _fetchier.WS.OPEN(_extends({ url: WSS_URL, token: token }, req));
    case "CLOSE":
      return _fetchier.WS.CLOSE(_extends({ url: WSS_URL }, req));
    case "PUT":
      return (0, _fetchier.PUT)(_extends({}, req));
    case "SUB":
      return _fetchier.WS.SUB({ url: req.url || WSS_URL, subscription: req });
    case "UNSUB":
      return _fetchier.WS.UNSUB(_extends({ url: WSS_URL }, req));
  }

  return Promise.reject("Incorrect action " + actionName);
}