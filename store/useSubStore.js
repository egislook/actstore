"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.useSubscribe = useSubscribe;

var _jsCookie = require("js-cookie");

var _jsCookie2 = _interopRequireDefault(_jsCookie);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

  var actStore = {
    cookies: _jsCookie2.default,
    configs: configs,
    router: router,
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
  actStore.act = registerActions(actStore, actions);
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
  // Setter
  function setStoreState(data) {
    var _this = this;

    if (data) {
      for (var key in data) {
        actStore.store[key] = data[key];
      }
    } else actStore.store = {};

    //setState(!data ? {} : actStore.store);
    actStore.store = !data ? {} : actStore.store;
    actStore.subscriptions.forEach(function (subscription) {
      subscription(_this.state);
    });
    return Promise.resolve(data);
  }
};
/*
    Internal setState function to manipulate actStore.state
    EX: actStore.setState({ loading: true });
 */


function setState(newState) {
  var _this2 = this;

  // Add the new state into our current state
  this.store = _extends({}, this.store, newState);
  // Then fire all subscribed functions in our subscriptions array
  this.subscriptions.forEach(function (subscription) {
    subscription(_this2.store);
  });
}
/*
    Internal act object which will hold all executable actions
    EX: actStore.act.doSomething(cool);
 */
function registerActions(actStore, actions) {
  var registeredActions = {};
  Object.keys(actions).forEach(function (key) {
    if (typeof actions[key] === "function")
      // If action is of type action we set this binding to null
      // then give it access to our actStore.
      // this will let us use actStore.setStore and chain our actStore.act
      registeredActions[key] = actions[key].bind(null, actStore);
    if (_typeof(actions[key]) === "object")
      // If action is of type object of functions
      // we recurse our registerActions function
      // EX: { counter: { increment, decrement } }
      registeredActions[key] = registerActions(actStore, actions[key]);
  });
  return registeredActions;
}
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