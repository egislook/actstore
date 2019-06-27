'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _fetchier = require('fetchier');

var _fetchier2 = _interopRequireDefault(_fetchier);

var _jsCookie = require('js-cookie');

var _jsCookie2 = _interopRequireDefault(_jsCookie);

var _useStore = require('./useStore');

var _useStore2 = _interopRequireDefault(_useStore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

// import queries from '../data/graphqlQueries';

// import react, { createContext, useState, useEffect, useContext } from 'react';

var context = void 0;

exports.default = function (react) {
  var createContext = react.createContext,
      useContext = react.useContext,
      useState = react.useState,
      useEffect = react.useEffect;

  context = context || createContext(null);
  var defaultStatus = { loading: null, info: null, confirm: null, update: null };

  GlobalProvider.context = context;

  return {
    // act,
    getRequestPromise: getRequestPromise,
    GlobalProvider: GlobalProvider,
    useActions: useActions,
    useGlobal: useGlobal
    // action
  };

  function GlobalProvider(props) {
    var children = props.children;

    var value = (0, _useStore2.default)(react, props, { act: act, useActions: useActions, action: action });
    return react.createElement(context.Provider, { children: children, value: value });
  }

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

    console.log('useGlobal');

    if (actions) useActions(actions, globalContext);
    return globalContext;
  }

  // triggers

  function act() {
    var _this = this;

    var args = [].concat(Array.prototype.slice.call(arguments));
    var actionName = args.shift();
    var actions = GlobalProvider.actions;

    var handleError = function handleError(error) {
      console.warn(error);
      return _this && _this.handle && _this.handle.info(error);
    };

    if (typeof actionName === 'function') return actionName.apply(this, arguments);

    if (typeof actionName === 'string') {
      var actFunction = actions[actionName] ? actions[actionName].bind(this).apply(undefined, _toConsumableArray(args)) : getRequestPromise.apply(this, arguments);
      return (typeof actFunction === 'undefined' ? 'undefined' : _typeof(actFunction)) === 'object' ? actFunction.catch(handleError) : Promise.resolve(actFunction);
    }

    if (Array.isArray(actionName)) return Promise.all(actionName.map(function (request) {
      return typeof request === 'string' ? act.bind(_this)(request) : (typeof request === 'undefined' ? 'undefined' : _typeof(request)) === 'object' ? getRequestPromise.bind(_this)(null, request) : request;
    })).catch(handleError);

    return handleError(actionName + ' action is missing correct actionName as first parameter');
  }

  function action(actionName) {
    var actions = GlobalProvider.actions;

    if (typeof actionName !== 'string' || !actions[actionName]) return Promise.reject(actionName + ' action can not be found');

    return function () {
      return actions[actionName].apply(this, arguments);
    };
  }

  function getRequestPromise(actionName, request) {
    var _ref = request || {},
        method = _ref.method,
        endpoint = _ref.endpoint,
        path = _ref.path,
        req = _ref.req;

    var _ref2 = this.config || {},
        GQL_URL = _ref2.GQL_URL,
        WSS_URL = _ref2.WSS_URL,
        endpoints = _ref2.endpoints;

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
        return _fetchier.WS.OPEN(_extends({ url: WSS_URL, token: token }, req));
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
};