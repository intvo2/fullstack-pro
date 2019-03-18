import * as React from 'react';
import { Route, Switch } from 'react-router';
import { Feature, FeatureWithRouterFactory } from '@common-stack/client-react';
import counterModules from '@sample-stack/counter/lib/browser';
const features =   new Feature(FeatureWithRouterFactory, counterModules);

const Layout = (props) => <div >{features.getRoutes()}</div>;

export const MainRoute =  features.getRoutes();

export default features;
