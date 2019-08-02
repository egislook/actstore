'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _jsCookie = require('js-cookie');

var _jsCookie2 = _interopRequireDefault(_jsCookie);

var _react = require('react');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var defaultStatus = { loading: null, info: null, confirm: null, update: null };

exports.default = function (props, _ref) {
  var act = _ref.act,
      action = _ref.action,
      useActions = _ref.useActions;
  var router = props.router,
      init = props.init,
      actions = props.actions,
      config = props.config;

  var _useState = (0, _react.useState)(_extends({}, defaultStatus, { loading: (typeof window === 'undefined' ? 'undefined' : _typeof(window)) !== 'object' })),
      _useState2 = _slicedToArray(_useState, 2),
      status = _useState2[0],
      setGlobalStatus = _useState2[1];

  var _useState3 = (0, _react.useState)({ token: _jsCookie2.default.get('token') }),
      _useState4 = _slicedToArray(_useState3, 2),
      global = _useState4[0],
      setGlobalStore = _useState4[1];

  var handlers = {
    loading: setLoading,
    info: handleInfo,
    clear: handleClear,
    confirm: handleConfirm,
    set: setGlobalHandler
  };

  var store = _extends({
    config: config
  }, props, {
    children: null,
    status: status,
    handle: handlers,
    store: _extends({}, global, {
      get: getGlobal,
      set: setGlobal
    }),
    route: {
      get: function get(str) {
        return str ? router.asPath.includes(str) : router.asPath;
      },
      set: setRoute
    },
    cookies: _jsCookie2.default
  });

  store.act = act.bind(store);
  store.action = action.bind(store);

  (0, _react.useEffect)(function () {
    store.act('APP_INIT');
  }, [_jsCookie2.default.get('token')]);

  useActions(actions, store);

  return store;

  // Getters

  function getGlobal(singleKey) {
    var keys = [].concat(Array.prototype.slice.call(arguments));
    if (!keys.length) return global;
    if (keys.length === 1) return global[singleKey];

    return keys.reduce(function (res, key) {
      return Object.assign(res, _defineProperty({}, key, global[key]));
    }, {});
  }

  // Setters

  function setGlobal(data, noUpdate) {

    if (data) {
      for (var key in data) {
        global[key] = data[key];
      }
    } else global = {};

    // console.log('GLOBAL', { data, global })
    setGlobalStore(!data ? {} : global);
    handleClear();
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
    store.status.loading !== loading && setGlobalStatus(globalStatus);
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

  // Handlers

  function handleClear() {
    var update = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : new Date().getTime();

    setGlobalStatus(_extends({}, defaultStatus, { update: update }));
  }

  function handleConfirm(action) {
    if (!action || action && typeof status.confirm !== 'function') return setGlobalStatus(_extends({}, defaultStatus, { confirm: action }));

    store.status.confirm();
    return setGlobalStatus(_extends({}, defaultStatus, { confirm: null }));
  }

  function handleInfo(data) {
    return setGlobalStatus(_extends({}, defaultStatus, { info: data && data.message || JSON.stringify(data) }));
  }
};