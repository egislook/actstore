import cookies from 'js-cookie'
import { useState, useEffect } from 'react'

const defaultStatus = { loading: null, info: null, confirm: null, update: null }

export default (props, { act, action, useActions }) => {
  const { router, init, actions, config } = props
  const [status, setGlobalStatus] = useState({
    ...defaultStatus,
    loading: typeof window !== 'object'
  })
  let [global, setGlobalStore] = useState({ token: cookies.get('token') })

  const handlers = {
    loading: setLoading,
    info: handleInfo,
    clear: handleClear,
    confirm: handleConfirm,
    set: setGlobalHandler
  }

  const store = {
    config,
    ...props,
    children: null,
    status,
    handle: handlers,
    store: {
      ...global,
      get: getGlobal,
      set: setGlobal
    },
    route: {
      get: str => (str ? router.asPath.includes(str) : router.asPath),
      set: setRoute
    },
    cookies
  }

  store.act = act.bind(store)
  store.action = action.bind(store)

  useEffect(() => {
    store.act('APP_INIT')
  }, [cookies.get('token')])

  useActions(actions, store)

  return store

  // Getters

  function getGlobal(singleKey) {
    const keys = [...arguments]
    if (!keys.length) return global
    if (keys.length === 1) return global[singleKey]

    return keys.reduce((res, key) => Object.assign(res, { [key]: global[key] }), {})
  }

  // Setters

  function setGlobal(data, noUpdate) {
    if (data) {
      for (let key in data) {
        global[key] = data[key]
      }
    } else global = {}

    // console.log('GLOBAL', { data, global })
    setGlobalStore(!data ? {} : global)
    handleClear()
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
    store.status.loading !== loading && setGlobalStatus(globalStatus)
  }

  function setRoute(name, disableRoute) {
    const route = init.routes[name] || { link: router.query.redirect || name }

    return new Promise(resolve => {
      if (disableRoute || router.asPath === (route.link || name)) return resolve(route)

      // router.events.on('routeChangeComplete', (url) => {
      //   router.events.off('routeChangeComplete');
      //   return resolve(url);
      // });
      return resolve(router.push(route.link, route.link, { shallow: true }))
    })
  }

  // Handlers

  function handleClear(update = new Date().getTime()) {
    setGlobalStatus({ ...defaultStatus, update })
  }

  function handleConfirm(action) {
    if (!action || (action && typeof status.confirm !== 'function'))
      return setGlobalStatus({ ...defaultStatus, confirm: action })

    store.status.confirm()
    return setGlobalStatus({ ...defaultStatus, confirm: null })
  }

  function handleInfo(data) {
    return setGlobalStatus({
      ...defaultStatus,
      info: (data && data.message) || JSON.stringify(data)
    })
  }
}
