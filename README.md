# ActStore

Just global store solution using react hooks, context and fetchier

## Install

- `npm install actstore`

## Getting Started

### STEP 1 - Initiating the store.

actstore is using existing react Context API so u need to add **GlobalProvider** to your app file

```javascript
import { GlobalProvider } from "actstore";
import config from "../config";
import actions from "../actions";

export default props => {
  const { Component, router, init } = props;
  return (
    <GlobalProvider
      init={init}
      config={config}
      router={router}
      actions={actions}
    >
      <Component {...props} />
    </GlobalProvider>
  );
};
```

### STEP 2 - Creating default actions.

ActStore uses 'APP_INIT' action as default when token is getting changed changed.  
We have bunch of default actions from **fetchier** like `GQL, POST, GET, OPEN, CLOSE, PUT, SUB, UNSUB`  
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

actstore has method **useActions** which can load and store actions to global store.  
You can use **act** method to execute specified action. We have bunch of default actions from **fetchier** like `GQL, POST, GET, OPEN, CLOSE, PUT, SUB, UNSUB`  
Actions have access to **act** and **store** to perform other actions inside the actions.  
You can set the global store value in action by triggering **store.set({ stats })**

```javascript
import { useActions } from "actstore";

export default props => {
  const { act, stats, socket, status } = useActions(actions);
  useEffect(() => {
    socket && act("STATS_FETCH");
  }, [socket]);

  return (
    <Layout title="Traffic Light">
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

##Subscription base API

#### useActStore() one hooks is all we need

Usage:

- Passing an object in will act as initialization of our global state.  
  This is the same as wrapping our app inside GlobalProvider context

```javascript
useActStore({ actions: [], initialState: { test: "test" } });
```

- Passing a function in will act as replacing actions for a specific component.  
  This is the same as useAct() for accessing act();

```javascript
const actions = ({ store }) => ({
  APP_INIT: () => {
    store.set({ ready: true, test: "dara" });
    return Promise.resolve(store.get());
  }
});
const { act, store } = useActStore(actions);
act("APP_INIT");
store.set({ test: "new value" });
```

- Use useActStore without passing any argument will act just like useGlobal().  
  This is for just accessing global state

```javascript
const { store } = useActStore();
store.set({ test: "new value" }); // Set a new state
const test = store.get("test"); // Get a state
```
