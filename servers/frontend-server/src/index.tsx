/// <reference path='../../../typings/index.d.ts' />
///<reference types="webpack-env" />
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as ReactFela from 'react-fela';
import { ApolloProvider } from 'react-apollo';
import { Provider as ReduxProvider } from 'react-redux';
import createRenderer from './setup/fela-renderer';
import { createApolloClient } from './setup/apollo-client';
import { createReduxStore, storeReducer } from './redux-config';
import { Component } from './components';
import { createRenderer as createFelaRenderer } from 'fela';
import { ConnectedRouter, routerMiddleware } from 'react-router-redux';
import { Switch } from 'react-router-dom';
import createHistory from 'history/createBrowserHistory';
import { Route } from 'react-router';
import modules from '@sample-stack/counter/lib/browser';
require('backend_reload');
import './index.css';
// import Routes from './Routes';

const rootEl = document.getElementById('content');


const client = createApolloClient();

let store;
if (module.hot && module.hot.data && module.hot.data.store) {
    // console.log("Restoring Redux store:", JSON.stringify(module.hot.data.store.getState()));
    store = module.hot.data.store;
    store.replaceReducer(storeReducer);
} else {
    store = createReduxStore();
}
if (module.hot) {
    module.hot.dispose(data => {
        // console.log("Saving Redux store:", JSON.stringify(store.getState()));
        data.store = store;
        // Force Apollo to fetch the latest data from the server
        delete window.__APOLLO_STATE__;
    });
}
const history: History = createHistory();

// Commented out ("let HTML app be HTML app!")
window.addEventListener('DOMContentLoaded', () => {
    const mountNode = document.getElementById('stylesheet');
    // const renderer = createRenderer(document.getElementById('font-stylesheet'));
    const renderer = createFelaRenderer();
    if (rootEl) {
        ReactDOM.render(
            <ReduxProvider store={store} >
                <ApolloProvider client={client}>
                    <ReactFela.Provider renderer={renderer}>
                        <ConnectedRouter history={history}>
                            <Switch>
                                {modules.route}
                            </Switch>
                        </ConnectedRouter>
                    </ReactFela.Provider>
                </ApolloProvider>
            </ReduxProvider>
            , rootEl);
    }
});
