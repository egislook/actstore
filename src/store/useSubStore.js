import React, { useEffect, useState } from 'react'
import cookies from 'js-cookie'

const DEFAULT_STATUS = {
  loading: null,
  info: null,
  confirm: null,
  update: null
}

/*
    This is our useActStore() hooks
 */
function useSubStore(props, { act, action }) {
  const { actions, config, init, router } = props
  const handlers = {
    clear: handleClear,
    confirm: handleConfirm,
    info: handleInfo,
    loading: setLoading,
    set: setGlobalHandler
  }
  const [status, setGlobalStatus] = useState({
    ...DEFAULT_STATUS,
    loading: typeof window !== 'object'
  })
  let [global, setGlobalStore] = useState({ token: cookies.get('token') })
  const store = {
    ...props,
    cookies,
    config,
    handle: handlers,
    router,
    route: {
      get: str => (str ? router.asPath.includes(str) : router.asPath),
      set: setRoute
    },
    status,
    store: {
      ...global,
      get: getStore,
      set: setStore
    },
    subscriptions: []
  }
  // Give internal setState function access our store
  store.setState = setState.bind(store)
  // Generate internal act object of executable actions
  store.act = act.bind(store)
  store.action = action.bind(store)
  // noinspection JSCheckFunctionSignatures
  registerActions.call(store, actions)
  // Return generated store
  return useInternalStore.bind(store)
  // Getters
  function getStore(singleKey) {
    const keys = [...arguments]
    if (!keys.length) return global
    if (keys.length === 1) return global[singleKey]
    return keys.reduce((res, key) => Object.assign(res, { [key]: global[key] }), {})
  }
  // Setters
  function setGlobalHandler(handler) {
    if (typeof handler !== 'object') return
    const handlerName = Object.key(handler).shift()
    handlers[handlerName] = handler[handlerName]
    return Promise.resolve(handler)
  }
  function setLoading(loading) {
    const globalStatus = { ...defaultStatus, loading }
    status.loading !== loading && setGlobalStatus(globalStatus)
  }
  function setRoute(name, disableRoute) {
    const route = init.routes[name] || { link: router.query.redirect || name }
    return new Promise(resolve => {
      if (disableRoute || router.asPath === (route.link || name)) return resolve(route)
      return resolve(router.push(route.link, route.link, { shallow: true }))
    })
  }
  function setStore(data) {
    if (data) {
      for (let key in data) {
        // noinspection JSUnfilteredForInLoop
        global[key] = data[key]
      }
    } else global = {}
    setGlobalStore(!data ? {} : global)
    store.store = { ...store.store, ...data }
    store.subscriptions.forEach(subscription => {
      subscription(store.store)
    })
    handleClear()
    return Promise.resolve(data)
  }
  // Handlers
  function handleClear(update = new Date().getTime()) {
    setGlobalStatus({ ...DEFAULT_STATUS, update })
  }
  function handleConfirm(action) {
    if (!action || (action && typeof status.confirm !== 'function'))
      return setGlobalStatus({ ...DEFAULT_STATUS, confirm: action })
    status.confirm()
    return setGlobalStatus({ ...DEFAULT_STATUS, confirm: null })
  }
  function handleInfo(data) {
    return setGlobalStatus({
      ...DEFAULT_STATUS,
      info: (data && data.message) || JSON.stringify(data)
    })
  }
}
/*
    Internal setState function to manipulate store.state
    EX: store.setState({ loading: true });
 */
function setState(newState) {
  // Add the new state into our current state
  this.store = { ...this.store, ...newState }
  // Then fire all subscribed functions in our subscriptions array
  this.subscriptions.forEach(subscription => {
    subscription(this.store)
  })
}
function registerActions() {
  const state = this || {}
  const actions = arguments[0](state)
  if (!this.actions) this.actions = {}
  const firstActionName = Object.keys(actions).shift()
  if (this.actions[firstActionName]) return state
  for (let actionName in actions) {
    // noinspection JSUnfilteredForInLoop
    this.actions[actionName] = actions[actionName].bind(state.set)
  }
  return state
}
/*
    Internal useInternalStore hooks to handle component subscriptions
    when it is mounted and unmounted.
 */
function useInternalStore() {
  const store = this
  // Get setState function from useState
  // noinspection JSCheckFunctionSignatures
  const newSubscription = useState()[1]
  useEffect(() => {
    store.act('APP_INIT')
  }, [store.cookies.get('token')])
  useEffect(() => {
    // Add setState function to our subscriptions array on component mount
    store.subscriptions.push(newSubscription)
    // Remove setState function from subscriptions array on component unmount
    return () => {
      try {
        store.subcriptions = store.subcriptions.filter(
          subscription => subscription !== newSubscription
        )
      } catch (e) {
        console.log(e)
      }
    }
  }, [])
  // Return back our whole store
  return store
}

export { useInternalStore }
export default useSubStore
