import { Injectable } from '@angular/core';
import { Router, Route } from '@angular/router';
import { Dictionary } from '@ngrx/entity';
import { ViewRendererComponent, LayoutData } from 'renderer';
import { ViewContainerComponent } from '../containers/view-container/view-container.component';
import { ViewConfig, LayoutConfig, ComponentConfig } from '../presenter.model';

@Injectable({
  providedIn: 'root'
})
export class RouteConfigurerService {
  /** IMPORTANT abstract class in the controller module, implementation in the renderer module */
  constructor(private router: Router) {}

  /**
   * Configure the views for all views received from the server
   * Iterate over all view tree to configure children routes as well
   */
  public configureViewRoutes(viewConfigs: Dictionary<ViewConfig>): void {
    // Build routes configurations for all views
    for (const viewKey of Object.keys(viewConfigs)) {
      const routes = this.buildTreeRouteConfig(
        viewConfigs[viewKey],
        viewConfigs[viewKey].layout
      );

      // Look for already defined route if baseRoute property is present
      let routeConfig = this.router.config;
      if (viewConfigs[viewKey].baseRoute !== null) {
        const homeRoute = this.router.config.find(config => config.path === '');

        if (homeRoute) {
          routeConfig = homeRoute.children;
        }

        if (viewConfigs[viewKey].baseRoute && viewConfigs[viewKey].baseRoute !== '') {
          const baseRouteConfig = routeConfig.find(
            (config: Route) => config.path === viewConfigs[viewKey].baseRoute
          );
          if (!baseRouteConfig.children) {
            baseRouteConfig.children = [];
          }
          routeConfig = baseRouteConfig.children;
        }
      }

      // Add routes to angular router configuration
      routeConfig.unshift(...routes);
    }
  }

  public configureRouteData(layoutData: Dictionary<LayoutData>) {
    Object.keys(layoutData).forEach(viewKey =>
      this.configureChildRouteData(layoutData[viewKey])
    );
  }

  private configureChildRouteData(layoutData: LayoutData) {
    const viewRoute = this.router.config.find(
      route => route.path === layoutData.route
    );
    this.configureChildrenData(layoutData, viewRoute);
  }

  private configureChildrenData(layoutData: LayoutData, routeConfig: Route) {
    if (
      !routeConfig ||
      !routeConfig.children ||
      routeConfig.children.length === 0 ||
      Object.keys(layoutData.children).length === 0
    ) {
      return;
    }

    for (const childKey of Object.keys(layoutData.children)) {
      const childConfig = layoutData.children[childKey];
      let childRoute = routeConfig;

      if (childConfig.route) {
        childRoute = routeConfig.children.find(
          route => route.path === childConfig.route
        );
        childRoute.data['response'] = childConfig;
      }

      if ('children' in childConfig) {
        this.configureChildrenData(childConfig, childRoute);
      }
    }
  }

  /**
   * Helper function to build an angular configuration object from the core configuration
   */
  private buildRouteConfig(
    viewConfig: ViewConfig,
    componentConfig: ComponentConfig,
    viewRoute: boolean
  ): Route {
    const routeConfig = {
      path: componentConfig.route,
      component: viewRoute ? ViewContainerComponent : ViewRendererComponent,
      data: {
        viewConfig: viewConfig
      }
    };

    return routeConfig;
  }

  /**
   * Recursive function: iterate over the tree, looking for routes configurations
   * in children components
   * @param viewConfig the global view configuration from which build the route config
   * @param componentConfig the concrete component configuration we are dealing with
   */
  private buildTreeRouteConfig(
    viewConfig: ViewConfig,
    componentConfig: ComponentConfig
  ): Route[] {
    // Build children routes if necessary
    const childrenRoutes: Route[] = [];

    if ('children' in componentConfig) {
      const layoutConfig = <LayoutConfig>componentConfig;
      for (const childKey of Object.keys(layoutConfig.children)) {
        // Call the function again for each child to look for child routes configurations
        const childRoutes = this.buildTreeRouteConfig(
          viewConfig,
          layoutConfig.children[childKey]
        );

        // And add the routes found to the other children routes
        childrenRoutes.push(...childRoutes);
      }
    }

    // If component has a route, configure it and add its children as route children
    if (componentConfig.route) {
      const routeConfig: Route = this.buildRouteConfig(
        viewConfig,
        componentConfig,
        componentConfig === viewConfig.layout
      );

      if (childrenRoutes.length > 0) {
        routeConfig.children = childrenRoutes;
      }

      return [routeConfig];
    }

    // If component does not have a route, return children routes only
    return childrenRoutes;
  }
}
