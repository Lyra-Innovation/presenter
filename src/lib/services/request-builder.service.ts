import { Injectable } from '@angular/core';
import { ViewData, Dictionary, LayoutData, ComponentData } from 'renderer';
import {
  ViewRequest,
  ViewConfig,
  LayoutConfig,
  ComponentConfig,
  LayoutRequest,
  ComponentRequest,
  StateRequest
} from '../presenter.model';
import { RootState } from '../state/presenter.reducer';
import {
  processDataSelector,
  selectPresenterState,
  selectViewConfigFromViewId
} from '../state/presenter.selectors';
import { createAction, PresenterActions } from '../state/presenter.actions';
import * as _ from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class RequestBuilderService {
  constructor() {}

  /**
   * Builds a request to the server from the config and data of the requested view, and the dictionary of global variables
   */
  public buildRequest(
    rootState: RootState,
    viewId: number,
    viewData: LayoutData
  ): ViewRequest {
    const presenterState = selectPresenterState(rootState);
    const viewConfig: ViewConfig = selectViewConfigFromViewId(viewId)(
      presenterState
    );

    const request: ViewRequest = {
      view: viewConfig.view,
      layout: <LayoutRequest>(
        this.buildComponentRequest(
          rootState,
          viewId,
          viewConfig.layout,
          viewData
        )
      )
    };

    return request;
  }

  public buildViewsRequest(
    rootState: RootState
  ): {
    request: StateRequest;
    successActions: Array<PresenterActions>;
    errorMessages: string[];
  } {
    const presenterState = selectPresenterState(rootState);

    let successActions = [];
    const errorMessages = [];
    for (const stateAction of presenterState.actionQueue) {
      if (stateAction.successActions) {
        const actions = _.cloneDeep(stateAction.successActions);
        successActions = successActions.concat(
          actions.map(successAction =>
            createAction(successAction.action, successAction.params)
          )
        );
        stateAction.successActions = null;
      }
      if (stateAction.errorMessage) {
        errorMessages.push(stateAction.errorMessage);
        stateAction.errorMessage = null;
      }
    }

    const requests: StateRequest = {
      views: presenterState.viewData.currentViews.reduce(
        (views, currentViewId) => ({
          ...views,
          [currentViewId]:
            presenterState.viewData.entities[currentViewId].request
        }),
        {}
      ),
      actions: presenterState.actionQueue
    };

    return {
      request: requests,
      successActions: successActions,
      errorMessages: errorMessages
    };
  }

  public buildComponentRequest(
    rootState: RootState,
    viewId: number,
    componentConfig: ComponentConfig,
    componentData: ComponentData
  ): ComponentRequest {
    const request: ComponentRequest = {
      params: {}
    };

    if ('children' in componentConfig) {
      const children = {};
      const layoutConfig = <LayoutConfig>componentConfig;
      for (const childKey of Object.keys(layoutConfig.children)) {
        children[childKey] = this.buildComponentRequest(
          rootState,
          viewId,
          layoutConfig.children[childKey],
          componentData ? componentData['children'][childKey] : null
        );
      }

      request['children'] = children;
    }

    request.params = this.buildParams(
      rootState,
      viewId,
      componentConfig,
      componentData
    );

    return request;
  }

  public buildParams(
    rootState: RootState,
    viewId: number,
    componentConfig: ComponentConfig,
    componentData: ComponentData
  ): Dictionary<any> {
    if (!componentConfig.values) {
      return {};
    }

    const params = {};

    for (const valueKey of Object.keys(componentConfig.values)) {
      const valueConfig = componentConfig.values[valueKey];
      if (
        typeof valueConfig === 'object' &&
        'query' in valueConfig &&
        valueConfig.query.inputs
      ) {
        const inputs = {};

        for (const inputConfig of valueConfig.query.inputs) {
          inputs[inputConfig.name] = processDataSelector(
            rootState,
            viewId,
            componentData,
            inputConfig.selectFrom
          );
        }

        params[valueKey] = inputs;
      }
    }
    return params;
  }
}
