import fetchier, { GET, POST, PUT, GQL, WS } from "fetchier";
import Cookies from "js-cookie";
import useStore from "./useStore";
import useSubStore from "./useSubStore";
// import queries from '../data/graphqlQueries';
import react from "react";

let context;
let initSubscription;

const { createContext, useContext, useState, useEffect } = react;
context = context || createContext(null);

export function GlobalProvider(props) {
  const { children } = props;
  const value = useStore(props, { act, useActions, action });
  // return <context.Provider value={value} children={children} />
  return react.createElement(context.Provider, { children, value });
}

/*
  Use this at root level component to initialize global store
  @actions|Array is required

  EX: App.js
  useSubscription({ actions: [], initialState: { test: "Test" }});
 */
export function useSubscription(props) {
  initSubscription = useSubStore(props);
  return initSubscription;
}

/*
  Use this to subscribe any component to global store

  EX: Component.js
  const actStore = useSubscribe();
  const { act, store } = actStore;
  console.log(store.test);
 */
export function useSubscribe() {
  return initSubscription();
}

export function usePerform(fn, store) {
  const initSubscription = useSubStore({ actions: fn});
  const actStore = initSubscription();
  const state = store || actStore || {};
  const actions = fn(state);
  if (!actStore.actions) actStore.actions = {};
  const firstActionName = Object.keys(actions).shift();
  if (actStore.actions[firstActionName]) return state;
  for (let actionName in actions) {
    actStore.actions[actionName] = actions[actionName].bind(state.set);
  }
  return state;
}

/*
  Cleaner function to memoize child components,
  only state change in the props will cause a re-render

  EX: useMemoize(Component, props);
 */
export function useMemoize(Component, props, triggers) {
  // noinspection JSCheckFunctionSignatures
  return react.useMemo(
    () => react.createElement(Component, props),
    triggers ? Object.values(triggers) : Object.values(props)
  );
}

GlobalProvider.context = context;

export default {
  // act,
  getRequestPromise,
  GlobalProvider,
  useActions,
  useGlobal
  // action
};

// Hooks

export function useActions(fn, globalContext) {
  const state = globalContext || useContext(context) || {};
  const actions = fn(state);

  if (!GlobalProvider.actions) GlobalProvider.actions = {};

  const firstActionName = Object.keys(actions).shift();
  if (GlobalProvider.actions[firstActionName]) return state;

  for (let actionName in actions) {
    GlobalProvider.actions[actionName] = actions[actionName].bind(state.set);
  }

  return state;
}

export function useGlobal(cfg = {}) {
  const { actions } = cfg;
  const globalContext = useContext(context);

  if (actions) useActions(actions, globalContext);
  return globalContext;
}

// triggers

export function act() {
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

export function action(actionName) {
  const actions = GlobalProvider.actions;

  if (typeof actionName !== "string" || !actions[actionName])
    return Promise.reject(actionName + " action can not be found");

  return function() {
    return actions[actionName].apply(this, arguments);
  };
}

export function getRequestPromise(actionName, request) {
  let { method, endpoint, path, req, query } = request || {};
  const { GQL_URL, WSS_URL, endpoints } = this.config || {};

  console.warn(
    actionName,
    endpoint ||
      (query &&
        query
          .replace(/[\n\t]/gm, "")
          .trim()
          .substr(0, 50)) ||
      ""
  );

  req = {
    method: actionName || (req && req.method) || method || "GET",
    endpoint: (req && req.endpoint) || endpoint,
    path: (req && req.path) || path || "",
    ...(req || request)
  };

  const token = Cookies.get("token");

  switch (req.method) {
    case "GQL":
    case "POST":
    case "GET":
      const url =
        req.method === "GQL" ? GQL_URL : endpoints[endpoint] + req.path;
      return fetchier[req.method]({ url, token, ...req });
    case "OPEN":
      return WS.OPEN({ url: WSS_URL, token, ...req });
    case "CLOSE":
      return WS.CLOSE({ url: WSS_URL, ...req });
    case "PUT":
      return PUT({ ...req });
    case "SUB":
      return WS.SUB({ url: req.url || WSS_URL, subscription: req });
    case "UNSUB":
      return WS.UNSUB({ url: WSS_URL, ...req });
  }

  return Promise.reject("Incorrect action " + actionName);
}
