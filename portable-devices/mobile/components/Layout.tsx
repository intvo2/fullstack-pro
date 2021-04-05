import React, {useState} from 'react';
import { Feature, FeatureWithRouterFactory } from '@common-stack/client-react';
import {MainHeader, DrawerRoute} from "../modules";
import * as RootNavigation from "../routes/root-navigation"
import { connect } from 'react-redux';
import {Dashboard} from "../pages"
import counterModules from "../modules/counter-module"

const features = new Feature(FeatureWithRouterFactory, counterModules);

const Layout = ({history, routes, location}: any) => {
    let subRoutes = routes.find((route: any) => route.routes && route)
    console.log("++LOC++", history)
    const [route, setRoute] = useState<any>({})
    const getMatchedRoute = (route: any) => {
        setRoute(route)
    }
    let drawerRef = React.useRef(null)
    return(
        <>
            <MainHeader title={route?.title} drawerRef={drawerRef} navigation={RootNavigation}/>
            <DrawerRoute history={history} drawerRef={drawerRef} getMatchedRoute={getMatchedRoute} location={location} routes={subRoutes.routes}/>
        </>
    )
}

export const ProLayout = connect(({ settings, router }: any) => ({
    settings,
    location: router.location,
}))(Layout);

export default new Feature({
    routeConfig: [
        {
            ['/org']:{
                exact:false,
                component: ProLayout
            },
        },
        {
            ['/']:{
                exact: true,
                component: Dashboard,
            }
        }
    ],
});