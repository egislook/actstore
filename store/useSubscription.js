'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
    This is our useActStore() hooks
 */
exports.default = function (_ref) {
    var actions = _ref.actions,
        configs = _ref.configs,
        init = _ref.init,
        initialState = _ref.initialState,
        router = _ref.router;

    var store = { configs: configs, router: router, state: initialState, subscriptions: [] };
    // Give internal setState function access our store
    store.setState = setState.bind(store);
    // Generate internal act object of executable actions
    store.act = registerActions(store, actions);
    // Other initialization
    if (init) init(store);
    // Return generated store
    return useStore.bind(store);
};

/*
    Internal setState function to manipulate store.state
    EX: store.setState({ loading: true });
 */


function setState(newState) {
    var _this = this;

    // Add the new state into our current state
    this.state = _extends({}, this.state, newState);
    // Then fire all subscribed functions in our subscriptions array
    this.subscriptions.forEach(function (subscription) {
        subscription(_this.state);
    });
}
/*
    Internal act object which will hold all executable actions
    EX: store.act.doSomething(cool);
 */
function registerActions(store, actions) {
    var registeredActions = {};
    Object.keys(actions).forEach(function (key) {
        if (typeof actions[key] === 'function')
            // If action is of type action we set this binding to null
            // then give it access to our store.
            // this will let us use store.setStore and chain our store.act
            registeredActions[key] = actions[key].bind(null, store);
        if (_typeof(actions[key]) === 'object')
            // If action is of type object of functions
            // we recurse our registerActions function
            // EX: { counter: { increment, decrement } }
            registeredActions[key] = registerActions(store, actions[key]);
    });
    return registeredActions;
}

/*
    Internal useStore hooks to handle component subscriptions
    when it is mounted and unmounted.
 */
function useStore() {
    var _this2 = this;

    // Get setState function from useState
    // noinspection JSCheckFunctionSignatures
    var newSubscription = (0, _react.useState)()[1];
    (0, _react.useEffect)(function () {
        // Add setState function to our subscriptions array on component mount
        _this2.subscriptions.push(newSubscription);
        // Remove setState function from subscriptions array on component unmount
        return function () {
            _this2.subcriptions = _this2.subcriptions.filter(function (subscription) {
                return subscription !== newSubscription;
            });
        };
    }, []);
    // Return back our whole store
    return this;
}