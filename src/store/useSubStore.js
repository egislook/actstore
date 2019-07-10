import cookies from "js-cookie";
import React, { useEffect, useState } from "react";

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
  const actStore = {
    cookies,
    configs,
    router,
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
  actStore.act = registerActions(actStore, actions);
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
  // Setter
  function setStoreState(data) {
    if (data) {
      for (let key in data) {
        actStore.store[key] = data[key];
      }
    } else actStore.store = {};

    //setState(!data ? {} : actStore.store);
    actStore.store = !data ? {} : actStore.store;
    actStore.subscriptions.forEach(subscription => {
      subscription(this.state);
    });
    return Promise.resolve(data);
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
/*
    Internal act object which will hold all executable actions
    EX: actStore.act.doSomething(cool);
 */
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
/*
    Internal useSubscribe hooks to handle component subscriptions
    when it is mounted and unmounted.
 */
export function useSubscribe() {
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
