import Cookies from 'js-cookie';

const defaultStatus = { loading: null, info: null, confirm: null, update: null };

export default (react, props, { act, action, useActions }) => {
  
  const { useState, useEffect } = react;
  const { router, init, actions, config } = props;
    
  const [status, setGlobalStatus] = useState({ ...defaultStatus, loading: true });
  let [global, setGlobalStore] = useState({ token: Cookies.get('token') });
  
  const handlers = {
    loading: setLoading,
    info: handleInfo,
    clear: handleClear,
    confirm: handleConfirm,
  };
  
  const store = {
    config,
    ...props,
    children: null,
    status, 
    ...global,
    handle: handlers,
    store: {
      get: getGlobal,
      set: setGlobal
    },
    route: {
      get: (str) => str ? router.asPath.includes(str) : router.asPath,
      set: setRoute
    }
  }
  
  store.act = act.bind(store); 
  store.action = action.bind(store);
  
  useEffect(() => { store.act('APP_INIT') }, [Cookies.get('token')]);
  
  useActions(actions, store);
  
  return store;

  // Getters
  
  function getGlobal(singleKey){
    const keys = [...arguments];
    if(!keys.length)
      return global;
    if(keys.length === 1)
      return global[singleKey];
      
    return keys.reduce((res, key) => Object.assign(res, { [key]: global[key] }), {});
  }
  
  // Setters
  
  function setGlobal(data, noUpdate){
    
    if(data){
      for(let key in data){
        global[key] = data[key];
      }
    } else global = {};
      
    setGlobalStore(!data ? {} : global);
    handleClear();
    return Promise.resolve(data);
  }
  
  function setLoading(loading){
    status.loading !== loading && setGlobalStatus({ ...defaultStatus, loading })
  }
  
  function setRoute(name, disableRoute){
    const route = init.routes[name] || { link: router.query.redirect || name };
    
    return new Promise( resolve => {
      if(disableRoute || router.asPath === (route.link || name ))
        return resolve(route)
      
      router.events.on('routeChangeComplete', (url) => {
        router.events.off('routeChangeComplete');
        return resolve(url);
      });
      router.push(route.link, route.link, { shallow: true });
    })
  }
  
  // Handlers
  
  function handleClear(update = new Date().getTime()){
    setGlobalStatus({ ...defaultStatus, update })
  }
  
  function handleConfirm(action){
    if(!action || (action && typeof status.confirm !== 'function'))
      return setGlobalStatus({ ...defaultStatus, confirm: action });
    
    status.confirm();
    return setGlobalStatus({ ...defaultStatus, confirm: null });
  }
  
  function handleInfo(data){
    return setGlobalStatus({ ...defaultStatus, info: data && data.message || JSON.stringify(data) })
  }
}