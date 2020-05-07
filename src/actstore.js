import React, { useEffect, useState } from 'react'
import fetchier, { GET, POST, PUT, GQL, WS } from 'fetchier'
import { upsert } from 'fetchier/utils'
import Cookies from 'js-cookie'

let init
let debug

export const ActStore = (props = {}) => {
  debug = props.debug
  debug && console.log('ACTSTORE: INIT')
  if(!init)
    init = useStore(props)

  const store = init()
  useEffect(() => { store.act('APP_INIT') }, [])
  return null
}

/*
  Cleaner function to memoize child components,
  only state change in the props will cause a re-render
  EX: useMemoize(Component, props);
 */
export function Memo({ children, triggers }) {
  //triggers && Object.values(triggers)) || child.props.triggers ? Object.values(child.props.triggers) :
  return React.Children.map(children, child => {
    return React.useMemo(() => child, triggers ? Object.values(triggers) : Object.values(child.props))
  })
}

export function useMemoize(Component, props, triggers) {
  return React.useMemo(
    () => React.createElement(Component, props),
    triggers ? Object.values(triggers) : Object.values(props)
  )
}

export default function useActStore(args, watch) {

  if(args && args.debug)
    debug = args.debug

  if(!init)
    init = useStore(args)

  const watcher = { watch, name: args && args.name }
  const store = init(watcher)

  useInternalStore.call(store, watcher)

  if (typeof args === 'object') {
    if(!args.actions) return store;
    const actions = args.actions(store)
    if (!store.actions) store.actions = {}
    for (let actionName in actions) {
      store.actions[actionName] = actions[actionName].bind(store)
    }
  }

  if (typeof args === 'function') {
    const actions = args(store)
    if (!store.actions) store.actions = {}
    const firstActionName = Object.keys(actions).shift()
    if (store.actions[firstActionName]) return store
    for (let actionName in actions) {
      store.actions[actionName] = actions[actionName].bind(store)
    }
    return store
  }

  return store
}

/*
    This is our useActStore() hooks
 */
function useStore(args = {}) {
  const { actions, configs, init = {}, initialState, router } = args
  const store = {
    ...args,
    init: {
      ...args.init,
      CLIENT: typeof window === 'object'
    },
    cookies: Cookies,
    configs,
    route: {
      get: getRoute,
      set: setRoute,
      match: str => router && router.asPath.includes(str)
    },
    store: {
      ...initialState,
      get: getGlobal,
      set: setGlobal
    },
    subscriptions: []
  }
  // Give internal setState function access our store
  store.resetState = resetState.bind(store, initialState)
  store.setState = setState.bind(store)
  // Generate internal act object of executable actions
  store.act = act.bind(store)
  store.action = action.bind(store)
  registerActions.call(store, actions)
  // Return subscribe-able hooks
  return () => store

  function getGlobal(singleKey) {
    const keys = [...arguments]
    if (!keys.length) return store.store
    if (keys.length === 1) return store.store[singleKey]
    return keys.reduce((res, key) => Object.assign(res, { [key]: store.store[key] }), {})
  }


  function setGlobal(data) {
    data ? store.setState(data) : store.resetState()
    return Promise.resolve(data)
  }

  function getRoute(singleKey) {

    const path = router && router.asPath && router.asPath.split('?').shift() || ''
    const routeData = {
      asPath: router && router.asPath,
      path,
      query: router && router.query,
      params: path.split('/').filter(val => val.length)
    }

    const keys = [...arguments]
    if (!keys.length) return routeData
    if (keys.length === 1) return routeData[singleKey]
    return keys.reduce((res, key) => Object.assign(res, { [key]: routeData[key] }), {})
  }

  function setRoute(name, disableRoute) {
    if(typeof name === 'object')
      return new Promise(resolve => resolve(router && router.push(name, name.pathname, { shallow: true })))

    const route = init.routes[name] || {
      link: router.query.redirect || name
    }

    return new Promise(resolve => {
      if (disableRoute || router && router.asPath === (route.link || name)) return resolve(route)
      return resolve(router && router.push(route.link, route.link, { shallow: true }))
    })
  }
}

/*
    Internal setState function to manipulate store.state
    EX: store.setState({ loading: true });
 */
function resetState(initialState) {
  this.store = {
    ...initialState,
    get: this.store.get,
    set: this.store.set
  }
  // Then fire all subscribed functions in our subscriptions array
  this.subscriptions.forEach(subscription => {
    subscription.setWatcher(this.store)
  })
}

function setState(newState) {
  // Add the new state into our current state

  // console.log(equal(newState, this.store), newState)
  const stateKeys = Object.keys(newState)

  if(!stateKeys.length)
    return debug && console.log('ACTSTORE ERROR: set accepts only objects')

  debug && console.log('ACTSTORE: set', newState)

  this.store = { ...this.store, ...newState }

  // Clears out false values in the store
  for (let key in stateKeys) {
    if (!newState[key]) delete this.store[key]
  }
  // Then fire all subscribed functions in our subscriptions array
  this.subscriptions.forEach(subscription => {
    if(!subscription.watch)
      return subscription.setWatcher(this.store)

    if(!subscription.watch.length)
      return

    if(subscription.watch.find(key => stateKeys.includes(key)))
      return subscription.setWatcher(this.store)
  })
}

function act() {
  const args = [...arguments]
  const actionName = args.shift()
  const actions = this.actions
  const handleError = error => {

    actions['APP_INFO']
      ? actions['APP_INFO'](error)
      : this && this.handle && this.handle.info(error)

    throw error
  }

  if (typeof actionName === 'function') return actionName.apply(this, arguments)
  if (typeof actionName === 'string') {
    const isAction = actions[actionName];
    const actFunction = isAction
      ? actions[actionName].bind(this)(...args)
      : getRequestPromise.apply(this, arguments)

    if(actFunction instanceof Promise)
      return isAction ? actFunction.catch(handleError) : actFunction
    else
      return Promise.resolve(actFunction)
  }
  if (Array.isArray(actionName))
    return Promise.all(
      actionName.map(request =>
        typeof request === 'string'
          ? act.bind(this)(request)
          : typeof request === 'object'
          ? getRequestPromise.bind(this)(null, request)
          : request
      )
    )
  return handleError(actionName + ' action is missing correct actionName as first parameter')
}

function action() {
  const args = [...arguments]
  const actionName = args.shift()

  const actions = this.actions
  if (typeof actionName !== 'string' || !actions[actionName])
    return Promise.reject(actionName + ' action can not be found')
  return function() {
    return actions[actionName].apply(this, args.length ? args : arguments)
  }
}

function registerActions() {
  const fn = arguments[0]
  this.actions = this.actions || {}

  if(!fn){
    debug && console.log('ACTSTORE ERROR:', 'No actions been stored')
    return this
  }
  const actions = fn(this)
  if (!this.actions) this.actions = {}
  // const firstActionName = Object.keys(actions).shift()
  // if (this.actions[firstActionName]) return this
  // Always update actions for now
  for (let actionName in actions) {
    this.actions[actionName] = actions[actionName].bind(this.set)
  }
  return this
}

function getRequestPromise(actionName, request) {
  let { method, endpoint, path, req, query } = request || {}
  const { GQL_URL, WSS_URL, endpoints } = this.config || {}
  debug && console.warn(actionName, request)
  req = {
    method: actionName || (req && req.method) || method || 'GET',
    endpoint: (req && req.endpoint) || endpoint,
    path: (req && req.path) || path || '',
    ...(req || request)
  }
  const token = Cookies.get('token')
  switch (req.method) {
    case 'POST':
    case 'GET':
    case 'DELETE':
    case 'PUT':
      return fetchier[req.method]({ url: endpoints[endpoint] + req.path, token, ...req })
    case 'GQL':
      if(!req.upsert && !req.data)
        return fetchier[req.method]({ url: GQL_URL, token, ...req })

      const upsertRequest = upsert({ data: req.upsert, ...req })
      if(!upsertRequest) return Promise.resolve('Nothing to change. Data is the same as Prev')
        return fetchier[req.method]({ url: GQL_URL, token, ...req, ...upsertRequest })
    case 'OPEN':
      const onError = req.onError || this.actions['APP_INFO'];
      return WS.OPEN({ url: WSS_URL, token, ...req, onError }, null)
    case 'CLOSE':
      return WS.CLOSE({ url: WSS_URL, ...req })
    case 'SUB':
      return WS.SUB({ url: req.url || WSS_URL, subscription: req })
    case 'UNSUB':
      return WS.UNSUB({ url: WSS_URL, ...req })
  }
  return Promise.reject('Incorrect action ' + actionName)
}

/*
    Internal useInternalStore hooks to handle component subscriptions
    when it is mounted and unmounted.
 */
function useInternalStore({ name, watch }) {
  // Get setState function from useState
  const [ watchers, setWatcher ] = useState(watch)
  const [ componentId ] = useState(name || Date.now() + Math.random());

  useEffect(() => {
    debug && console.log('ACTSTORE: hooked to', componentId);
    // Add setState function to our subscriptions array on component mount
    this.subscriptions.push({ watch, setWatcher, name, componentId })
    // Remove setState function from subscriptions array on component unmount
    return () => {
      console.log('unmounting')
      return
      if (!this.subscriptions) return console.error('ACTSTORE: missing store subscriptions to unsubscribe')
      debug && console.log('ACTSTORE: unhooked from', name || 'unknown');
      this.subscriptions = this.subscriptions.filter(
        subscription => subscription.setWatcher !== setWatcher
      )
    }
  }, [])
  // Return subscribe-able hooks
  return this
}
