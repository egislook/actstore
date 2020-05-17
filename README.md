# ActStore

Just global store solution using react hooks and fetchier. Works with ReactNative and ReactWeb

## Install

- `npm install actstore`

## Getting Started

### STEP 1 - Initiating the store.

actstore is using subscription concept to handle global state, each use of useActStore() in a React component will subscribe that component to the global store on component mounted and will be unsubscribed when that component is unmounted.

```javascript
import React from 'react'
import Actstore from 'actstore'
import AsyncStorage from '@react-native-community/async-storage' //for react native
import JSCookies from 'js-cookie' //for react web

const Cookies = JSCookies || {
	set: AsyncStorage.setItem,
	get: AsyncStorage.getItem,
	clear: AsyncStorage.clear
}

export default () => {
  // Initiates actstore and returns `store` and `act` arguments
  const { store, act } = Actstore({ actions, configs, Cookies }, ['ready'])
  // Trigger init action
  useEffect(() => { act('APP_INIT') }, [])
  // Render Views
  return (</>)
}

// Actions can be used using act or action
const actions = ({ store }) => ({
  APP_INIT: async () => {
    await store.set({ count: 1, ready: true })
  }
})

// Config
import { version } from '../package.json';
const CFG = process.env

const DOMAIN = CFG.DOMAIN || 'test.project.com'
const API_URL = 'https://'+ DOMAIN +'/api'

const configs = {
  ENV: CFG.env || CFG.NODE_ENV,
  GQL_URL: 'https://' + DOMAIN + '/v1alpha1/graphql',
  WSS_URL: 'wss://' + DOMAIN + '/v1alpha1/graphql',
  endpoints: {
    areas: API_URL + '/areas/',
    upload: API_URL + '/upload',
    qr: API_URL + '/qr',
    login: API_URL + '/login'
  },
  routes: {
    index: { link: '/', title: 'Home', icon: 'home' },
    login: { link: '/login', title: 'Login' },
    register: { link: '/register', title: 'Register' }
  },
  ver: CFG.npm_package_version || version
}
```

### STEP 2 - Use global store and actions in Component.

actstore has convenience React hooks **useActStore()** which can get and set store actions to global store.  
You can use **act()** method to execute specified action. We have a bunch of default actions from **fetchier** like `GQL, POST, GET, OPEN, CLOSE, PUT, SUB, UNSUB`  
Actions have access to **act** and **store** to perform other actions inside the actions.  
You can set the global store value in action by triggering **store.set({ newState })**

```javascript
import React from 'react'
import useActStore from 'actstore';
import { Card } from 'src/elems'

export default props => {
  const { act, store } = useActStore(actions)
  const { socket, stats } = store.get('socket')
  useEffect(() => { socket && act('STATS_FETCH') }, [socket])

  return (
    <div>
      {stats && stats.map(item => <Card key={item.label} {...item} />)}
    </div>
  );
};

const actions = ({ act, store }) => ({
  STATS_FETCH: () =>
    !store.get('stats') &&
    act('GQL', {
      query: `
        fetchStatistic {
          consumersOverall: Consumer_aggregate{ aggregate{ count } }
          comsumersPending: Consumer_aggregate(where: { status: { _eq: 0}}){ aggregate{ count } }
          comsumersActive: Consumer_aggregate(where: { status: { _eq: 1}}){ aggregate{ count } }
          comsumersDeclined: Consumer_aggregate(where: { status: { _eq: 8}}){ aggregate{ count } }

          merchantsOverall: Merchant_aggregate{ aggregate{ count } }
          merchantsPending: Merchant_aggregate(where: { status: { _eq: "0"}}){ aggregate{ count } }
          merchantsActive: Merchant_aggregate(where: { status: { _eq: "1"}}){ aggregate{ count } }
          merchantsDeclined: Merchant_aggregate(where: { status: { _eq: "8"}}){ aggregate{ count } }
        }
      `
    })
      .then(stats => {
        const data = Object.keys(stats).reduce(
          (obj, key) => ({ ...obj, [key]: stats[key].aggregate.count }),
          {}
        );

        return {stats: [
          {
            label: 'consumers',
            total: data.consumersOverall,
            pendingNumber: data.comsumersPending,
            activatedNumber: data.comsumersActive,
            declinedNumber: data.comsumersDeclined
          },
          {
            label: 'merchants',
            total: data.merchantsOverall,
            pendingNumber: data.merchantsPending,
            activatedNumber: data.merchantsActive,
            declinedNumber: data.merchantsDeclined
          }
        ]}
      })
      .then(store.set)
});
```
