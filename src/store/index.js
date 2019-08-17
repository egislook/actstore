import React, { useEffect, useState } from 'react'
import fetchier, { GET, POST, PUT, GQL, WS } from 'fetchier'
import { upsert } from 'fetchier/utils'
import Cookies from 'js-cookie'

let init = null
const defaultStatus = {
  loading: null,
  info: null,
  confirm: null,
  update: null
}

export const ActStore = props => {
  const { act } = useActStore(props)
  useEffect(() => { act('APP_INIT')}, [])
  // console.log('ACTSTORE: Init')
  return null
}

/*
  Cleaner function to memoize child components,
  only state change in the props will cause a re-render
  EX: useMemoize(Component, props);
 */
export function Memo({ children, triggers }) {
  return React.Children.map(children, child => {
    return React.useMemo(() => child, (triggers && Object.values(triggers)) || child.props.triggers ? Object.values(child.props.triggers) : Object.values(child.props))
  })
}

export function useMemoize(Component, props, triggers) {
  return React.useMemo(
    () => React.createElement(Component, props),
    triggers ? Object.values(triggers) : Object.values(props)
  )
}

export default function useActStore(args) {
  if (!init) {
    init = useStore(args)
    return init()
  }

  if (typeof args === 'object') {
    const store = init()
    const actions = args.actions(store)
    if (!store.actions) store.actions = {}
    // TODO!!!
    // Add flag not to allow overwrite actions.
    // For development purpose its better to overwrite cause updated actions are getting stored even if they are with the same name.
    const firstActionName = false && Object.keys(actions).shift()
    if (store.actions[firstActionName]) return store
    for (let actionName in actions) {
      store.actions[actionName] = actions[actionName].bind(store)
    }
    return store
  }

  if (typeof args === 'function') {
    const store = init()
    const actions = args(store)
    if (!store.actions) store.actions = {}
    const firstActionName = Object.keys(actions).shift()
    if (store.actions[firstActionName]) return store
    for (let actionName in actions) {
      store.actions[actionName] = actions[actionName].bind(store)
    }
    return store
  }

  return init()
}

/*
    This is our useActStore() hooks
 */
function useStore(args) {
  const { actions, config, init = {}, initialState, router } = args
  const handlers = {
    clear: handleClear,
    confirm: handleConfirm,
    info: handleInfo,
    loading: setLoading,
    set: setGlobalHandler
  }
  const store = {
    ...args,
    init: {
      ...args.init,
      CLIENT: typeof window === 'object'
    },
    cookies: Cookies,
    config,
    handle: handlers,
    route: {
      get: getRoute,
      set: setRoute,
      match: str => router.asPath.includes(str)
    },
    status: {
      ...defaultStatus,
      loading: typeof window !== 'object'
    },
    store: {
      ...initialState,
      token: Cookies.get('token'),
      get: getGlobal,
      set: setGlobal
    },
    subscriptions: []
  }
  // Give internal setState function access our store
  store.resetState = resetState.bind(store, initialState)
  store.setState = setState.bind(store)
  store.setStatusState = setStatusState.bind(store)
  // Generate internal act object of executable actions
  if (actions) {
    store.act = act.bind(store)
    store.action = action.bind(store)
    registerActions.call(store, actions)
  }
  // Return subscribe-able hooks
  return useInternalStore.bind(store)

  function getGlobal(singleKey) {
    const keys = [...arguments]
    if (!keys.length) return store.store
    if (keys.length === 1) return store.store[singleKey]
    return keys.reduce((res, key) => Object.assign(res, { [key]: store.store[key] }), {})
  }
  
  
  function setGlobal(data) {
    // Add the new state into our current state
    if (data) {
      store.setState(data)
      store.setStatusState({
        ...defaultStatus,
        update: new Date().getTime()
      })
    } else {
      store.resetState()
      store.setStatusState({
        ...defaultStatus,
        update: new Date().getTime()
      })
    }
    return Promise.resolve(data)
  }

  function setGlobalHandler(handler) {
    if (typeof handler !== 'object') return
    const handlerName = Object.key(handler).shift()
    handlers[handlerName] = handler[handlerName]
    return Promise.resolve(handler)
  }

  function setLoading(loading) {
    const globalStatus = { ...defaultStatus, loading }
    store.status.loading !== loading && store.setStatusState(globalStatus)
  }
  
  
  
  function getRoute(singleKey) {
    
    const path = router && router.asPath && router.asPath.split('?').shift() || ''
    const routeData = {
      asPath: router.asPath,
      path,
      query: router.query,
      params: path.split('/').filter(val => val.length)
    }
    
    const keys = [...arguments]
    if (!keys.length) return routeData
    if (keys.length === 1) return routeData[singleKey]
    return keys.reduce((res, key) => Object.assign(res, { [key]: routeData[key] }), {})
  }

  function setRoute(name, disableRoute) {
    if(typeof name === 'object')
      return new Promise(resolve => resolve(router.push(name, name.pathname, { shallow: true })))
      
    const route = init.routes[name] || {
      link: router.query.redirect || name
    }
    
    return new Promise(resolve => {
      if (disableRoute || router.asPath === (route.link || name)) return resolve(route)
      return resolve(router.push(route.link, route.link, { shallow: true }))
    })
  }

  function handleClear(update = new Date().getTime()) {
    store.setStatusState({
      ...defaultStatus,
      update
    })
  }

  function handleConfirm(action) {
    if (!action || (action && typeof store.status.confirm !== 'function'))
      return store.setStatusState({ ...defaultStatus, confirm: action })
    store.status.confirm()
    return store.setStatusState({ ...defaultStatus, confirm: null })
  }

  function handleInfo(data) {
    store.setStatusState({
      ...defaultStatus,
      info: (data && data.message) || JSON.stringify(data)
    })
  }
}

/*
    Internal setState function to manipulate store.state
    EX: store.setState({ loading: true });
 */
function resetState() {
  const initialState = arguments[0]
  this.store = {
    ...initialState,
    token: Cookies.get('token'),
    get: this.store.get,
    set: this.store.set
  }
  // Then fire all subscribed functions in our subscriptions array
  this.subscriptions.forEach(subscription => {
    subscription(this.store)
  })
}

function setState(newState) {
  // Add the new state into our current state
  this.store = { ...this.store, ...newState }
  // Clears out false values in the store
  for (let key in newState) {
    if (!newState[key]) delete this.store[key]
  }
  // Then fire all subscribed functions in our subscriptions array
  this.subscriptions.forEach(subscription => {
    subscription(this.store)
  })
}

function setStatusState(newStatusState) {
  // Add the new state into our current state
  this.status = { ...this.status, ...newStatusState }
  // Then fire all subscribed functions in our subscriptions array
  this.subscriptions.forEach(subscription => {
    subscription(this.status)
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
  const actions = fn(this)
  if (!this.actions) this.actions = {}
  const firstActionName = Object.keys(actions).shift()
  if (this.actions[firstActionName]) return this
  for (let actionName in actions) {
    this.actions[actionName] = actions[actionName].bind(this.set)
  }
  return this
}

function getRequestPromise(actionName, request) {
  let { method, endpoint, path, req, query } = request || {}
  const { GQL_URL, WSS_URL, endpoints } = this.config || {}
  console.warn(
    actionName,
    endpoint ||
      (query &&
        query
          .replace(/[\n\t]/gm, '')
          .trim()
          .substr(0, 50)) ||
      ''
  )
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
    case 'PUT':
      return PUT({ ...req })
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
function useInternalStore() {
  // Get setState function from useState
  const newSubscription = useState()[1]
  useEffect(() => {
    // Add setState function to our subscriptions array on component mount
    this.subscriptions.push(newSubscription)
    // Remove setState function from subscriptions array on component unmount
    return () => {
      if (!this.subscriptions) return console.log('useInternalStore', this)
      this.subscriptions = this.subscriptions.filter(
        subscription => subscription !== newSubscription
      )
    }
  }, [])
  // Return subscribe-able hooks
  return this
}
