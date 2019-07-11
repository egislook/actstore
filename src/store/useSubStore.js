import cookies from "js-cookie";
import React, { useEffect, useState } from "react";
import { getRequestPromise, GlobalProvider } from "./index";

const defaultStatus = {
  loading: null,
  info: null,
  confirm: null,
  update: null
};
/*
    This is our useActStore() hooks
 */
export default ({ actions, configs, init, initialState, router }) => {
  const [status, setGlobalStatus] = useState({
    ...defaultStatus,
    loading: typeof window !== "object"
  });
  const handlers = {
    loading: setLoading,
    info: handleInfo,
    clear: handleClear,
    confirm: handleConfirm,
    set: setGlobalHandler
  };
  const actStore = {
    cookies,
    configs,
    handle: handlers,
    route: {
      router,
      get: str => getRoute(str),
      set: setRoute
    },
    status,
    store: {
      ...initialState,
      token: cookies.get("token"),
      get: getStoreState,
      set: setStoreState
    },
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
    const keys = [...arguments];
    if (!keys.length) return actStore.store;
    if (keys.length === 1) return actStore.store[singleKey];
    return keys.reduce(
      (res, key) => Object.assign(res, { [key]: actStore.store[key] }),
      {}
    );
  }
  function getRoute(str) {
    return str ? router.asPath.includes(str) : router.asPath;
  }
  // Setter
  function setStoreState(data) {
    if (data) {
      for (let key in data) {
        actStore.store[key] = data[key];
      }
    } else actStore.store = {};
    setState.apply(actStore, !data ? {} : actStore.store);
    handleClear();
    return Promise.resolve(data);
  }
  function setRoute(name, disableRoute) {
    const route = init.routes[name] || { link: router.query.redirect || name };
    return new Promise(resolve => {
      if (disableRoute || router.asPath === (route.link || name))
        return resolve(route);
      // router.events.on('routeChangeComplete', (url) => {
      //   router.events.off('routeChangeComplete');
      //   return resolve(url);
      // });
      return resolve(router.push(route.link, route.link, { shallow: true }));
    });
  }
  function setLoading(loading){
    const globalStatus = { ...defaultStatus, loading };
    status.loading !== loading && setGlobalStatus(globalStatus);
  }
  function setGlobalHandler(handler){
    if(typeof handler !== 'object')
      return;
    const handlerName = Object.key(handler).shift();
    handlers[handlerName] = handler[handlerName];
    return Promise.resolve(handler);
  }
  // Handlers
  function handleClear(update = new Date().getTime()) {
    actStore.status = { ...defaultStatus, update };
  }
  function handleConfirm(action) {
    if (!action || (action && typeof status.confirm !== "function"))
      return setGlobalStatus({ ...defaultStatus, confirm: action });
    status.confirm();
    return setGlobalStatus({ ...defaultStatus, confirm: null });
  }
  function handleInfo(data) {
    return setGlobalStatus({
      ...defaultStatus,
      info: (data && data.message) || JSON.stringify(data)
    });
  }
};
/*
    Internal setState function to manipulate actStore.state
    EX: actStore.setState({ loading: true });
 */
function setState(newState) {
  // Add the new state into our current state
  this.store = { ...this.store, ...newState };
  // Then fire all subscribed functions in our subscriptions array
  this.subscriptions.forEach(subscription => {
    subscription(this.store);
  });
}
function act() {
  const args = [...arguments];
  const actionName = args.shift();
  const actions = GlobalProvider.actions;
  // console.log('[ACT]', actionName, args);
  const handleError = error => {
    console.warn(error);
    return this && this.handle && this.handle.info(error);
  };
  if (typeof actionName === "function")
    return actionName.apply(this, arguments);
  if (typeof actionName === "string") {
    const actFunction = actions[actionName]
      ? actions[actionName].bind(this)(...args)
      : getRequestPromise.apply(this, arguments);
    return typeof actFunction === "object"
      ? actFunction.catch(handleError)
      : Promise.resolve(actFunction);
  }
  if (Array.isArray(actionName))
    return Promise.all(
      actionName.map(request =>
        typeof request === "string"
          ? act.bind(this)(request)
          : typeof request === "object"
          ? getRequestPromise.bind(this)(null, request)
          : request
      )
    ).catch(handleError);
  return handleError(
    actionName + " action is missing correct actionName as first parameter"
  );
}
function action(actionName) {
  const actions = this.actions;
  if (typeof actionName !== "string" || !actions[actionName])
    return Promise.reject(actionName + " action can not be found");
  return function() {
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
  // Get setState function from useState
  // noinspection JSCheckFunctionSignatures
  const newSubscription = useState()[1];
  useEffect(() => {
    // Add setState function to our subscriptions array on component mount
    this.subscriptions.push(newSubscription);
    // Remove setState function from subscriptions array on component unmount
    return () => {
      this.subcriptions = this.subcriptions.filter(
        subscription => subscription !== newSubscription
      );
    };
  }, []);
  return this;
}
