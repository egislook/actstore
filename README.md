# ActStore

Just global store solution using react hooks and fetchier

## Install

- `npm install actstore`

## Getting Started

### STEP 1 - Initiating the store.

actstore is using subscription concept to handle global state, each use of useActStore() in a React component will subscribe that component to the global store on component mounted and will be unsubscribed when that component is unmounted.

#### Initiate in React Static 
```javascript
import React from 'react';
import { Root, Routes } from 'react-static';
import { Router } from '@reach/router';
import useActStore from 'actstore';
import actions from '../actions';

export default () => {
  useActStore({ actions, config: {}, init: {}, router: Router})
  return (
    <Root>
      <Router>
        <Routes path="*" />
      </Router>
    </Root>
  );
};
```

#### Initiate in  Next.js _app custom component
```javascript
import React from 'react';
import App, { Container } from 'next/app';
import { ActStore } from 'actstore';
import actions from '../actions';
import config from '../config';

export default class extends App {
  render() {
    const { Component, init } = this.props;
    return (
      <Container>
        <ActStore actions={actions} config={config} init={init} initialState={{ test: "test" }} router={router} />
        <main>
          <Component init={init} />
        </main>
      </Container>
    );
  }
}
```

### STEP 2 - Creating default actions.

ActStore uses 'APP_INIT' action as default when token is getting changed.  
We have a bunch of default actions from **fetchier** like `GQL, POST, GET, OPEN, CLOSE, PUT, SUB, UNSUB`  
You can use array of acts like **act(['OPEN', 'USER_FETCH'])** it uses Promise.all and returns array of values.  
Actions are Promise based so you can use **async/await** or default promise syntax

```javascript
export default ({ act, route, store }) => ({
  USER_FETCH: token =>
    act("GQL", {
      query: `query { Users( where: { credential: { sessions: { token: {_eq: "${token}"}} }}) { id role name photo } }`
    }).then(({ Users: [user] }) => user),

  APP_INIT: () => {
    const { token } = store.get("token", "socket");

    if (token)
      return route
        .set("index", !route.get("login"))
        .then(() =>
          act(["OPEN", "USER_FETCH"]).then(([socket, user]) =>
            store.set({ socket, user })
          )
        );

    if (!route.get("login"))
      return route.set("login").then(() => act("CLOSE").then(store.set));

    return act("CLOSE").then(store.set);
  }
});
```

### STEP 3 - Use global store in Component.

actstore has convenience React hooks **useActStore()** which can get and set store actions to global store.  
You can use **act()** method to execute specified action. We have a bunch of default actions from **fetchier** like `GQL, POST, GET, OPEN, CLOSE, PUT, SUB, UNSUB`  
Actions have access to **act** and **store** to perform other actions inside the actions.  
You can set the global store value in action by triggering **store.set({ newState })**

```javascript
import React from 'react'
import { Card, Layout } from 'ui';
import useActStore from 'actstore';

export default props => {
  const { act, stats, socket, status } = useActStore(actions);
  useEffect(() => {
    socket && act("STATS_FETCH");
  }, [socket]);

  return (
    <Layout>
      {stats && stats.map(item => <Card key={item.label} {...item} />)}
    </Layout>
  );
};

const actions = ({ act, store }) => ({
  STATS_FETCH: () =>
    !store.get("stats") &&
    act("GQL", {
      query: `
      query fetchStatistic {
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

        return [
          {
            label: "consumers",
            total: data.consumersOverall,
            pendingNumber: data.comsumersPending,
            activatedNumber: data.comsumersActive,
            declinedNumber: data.comsumersDeclined
          },
          {
            label: "merchants",
            total: data.merchantsOverall,
            pendingNumber: data.merchantsPending,
            activatedNumber: data.merchantsActive,
            declinedNumber: data.merchantsDeclined
          }
        ];
      })
      .then(stats => store.set({ stats }))
});
```

### ActGen CLI

Generate React function component lightning fast in actstore structure

#### Usage
##### 1. Create screen component with comps.js, elems.js and hooks.js.  
```javascript
actgen consumers
```
Result:
```
consumers
│   comps.js
│   elems.js    
│   hooks.js
```
##### 2. Create custom component inside a screen component with comps.js, elems.js and hooks.js
```javascript
actgen consumers/Form
```
Result:
```
consumers
│   comps.js
│   elems.js    
│   hooks.js
└───Form
│   │   comps.js
│   │   elems.js
│   │   hooks.js
```

##### 3. Create screen or custom component with only index.js inside
```javascript
actgen consumers -m
```
Result:
```
consumers
│   index.js
```
##### 4. Create screen or custom component with useActStore() imported and usage example
```javascript
actgen consumers -a
```
Result:
```
consumers
│   comps.js
│   elems.js    
│   hooks.js
```
inside comps.js
```javascript
import React from 'react';
import useActStore from 'actstore';

export default ({  }) => {
  const { act, store } = useActStore();
  console.log("CustomersScreen render");
  return (
    <div className="">
      
    </div>
  );
}
```