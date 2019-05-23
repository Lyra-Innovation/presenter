import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  ValueData,
  ModelSelect,
  ScopeSelect,
  ComponentData,
  Dictionary
} from 'renderer';
import { PresenterState, RootState } from './presenter.reducer';
import { ActivatedRouteSnapshot } from '@angular/router';

export const selectRootState = createFeatureSelector('presenter');

export const selectPresenterState = (state: RootState) => state.presenter;

export const isConfigLoaded = createSelector(
  selectRootState,
  (state: RootState) => state.presenter.config != null
);

export const selectLoggedUser = createSelector(
  selectRootState,
  (state: RootState) => state.presenter.loggedUser
);

export const selectViewConfig = (view: string) => (state: PresenterState) =>
  state.config[view];

export const selectNextViewId = createSelector(
  selectRootState,
  (state: RootState) => state.presenter.viewData.nextStateId
);

export const selectViewConfigFromViewId = (viewId: number) => (
  state: PresenterState
) => state.config[state.viewData.entities[viewId].view];

export const selectGlobalVariable = (variableName: string) => (
  state: PresenterState
) => state.globalVariables[variableName];

export const selectViewVariable = (viewId: number, variableName: string) => (
  state: PresenterState
) => state.viewData.entities[viewId].variables[variableName];

export const selectViewById = (viewId: number) =>
  createSelector(
    selectRootState,
    (rootState: RootState) => {
      const viewData = selectPresenterState(rootState).viewData.entities[
        viewId
      ];

      // Process layout values if present
      if (viewData && viewData.response) {
        viewData.response = processDataSelectors(
          rootState,
          viewId,
          viewData.response
        );
      }
      return viewData;
    }
  );

export function processDataSelectors<T extends ComponentData>(
  rootState: RootState,
  viewId: number,
  config: T
): T {
  if ('children' in config) {
    for (const childKey of Object.keys(config['children'])) {
      config['children'][childKey] = processDataSelectors(
        rootState,
        viewId,
        config['children'][childKey]
      );
    }
  }

  for (const valueKey of Object.keys(config.values)) {
    if (config.values[valueKey] instanceof Array) {
      for (let i = 0; i < (<ValueData[]>config.values[valueKey]).length; i++) {
        config.values[valueKey][i] = processDataSelector(
          rootState,
          viewId,
          config,
          config.values[valueKey][i]
        );
      }
    } else {
      config.values[valueKey] = processDataSelector(rootState, viewId, config, <
        ValueData
      >config.values[valueKey]);
    }
  }

  config.values.$me = processDataSelector(rootState, viewId, config, '$me');

  if (config.events) {
    for (const eventKey of Object.keys(config.events)) {
      for (const action of config.events[eventKey]) {
        if (action.params) {
          for (const paramKey of Object.keys(action.params)) {
            action.params[paramKey] = processDataSelector(
              rootState,
              viewId,
              config,
              action.params[paramKey]
            );

            if (paramKey === 'params') {
              if (typeof action.params.params === 'object') {
                for (const actionParamKey of Object.keys(
                  action.params.params
                )) {
                  action.params.params[actionParamKey] = processDataSelector(
                    rootState,
                    viewId,
                    config,
                    action.params.params[actionParamKey]
                  );
                }
              } else {
                action.params.params = processDataSelector(
                  rootState,
                  viewId,
                  config,
                  action.params.params
                );
              }
            }

            if (paramKey === 'where') {
              for (const actionParamKey of Object.keys(action.params.where)) {
                action.params.where[actionParamKey] = processDataSelector(
                  rootState,
                  viewId,
                  config,
                  action.params.where[actionParamKey]
                );
              }
            }
          }
        }
      }
    }
  }

  return config;
}

export const processDataSelector = (
  rootState: RootState,
  viewId: number,
  componentData: ComponentData,
  value: ValueData
) => {
  if (value != null && typeof value === 'object') {
    if ('model' in value && 'id' in value && 'attribute' in value) {
      return processModelSelector(rootState, <ModelSelect>value);
    } else if ('scope' in value && 'select' in value) {
      const selected = processScopeSelector(rootState, viewId, componentData, <
        ScopeSelect
      >value);
      return selected != null ? selected : value;
    } else if ('default' in value) {
      return value['default'];
    }
  } else if (value === '$me') {
    const state = selectPresenterState(rootState);
    return state.loggedUser ? state.loggedUser.id : null;
  }
  return value;
};

const processModelSelector = (rootState: RootState, select: ModelSelect) => {
  const state = selectPresenterState(rootState);
  if (!(select.model in state.models)) {
    console.error(
      `[PRESENTER ERROR] Model "${
        select.model
      }" not found in the currently held models`
    );
  }
  if (!(select.id in state.models[select.model])) {
    console.error(
      `[PRESENTER ERROR] Id "${
        select.id
      }" not found in the currently held models of type ${select.model}`
    );
  }

  return evalSelect(state.models[select.model][select.id], select.attribute);
};

function evalSelect(object: any, attribute: string) {
  const delimiter = attribute.startsWith('[') ? '' : '.';
  const selector = delimiter + attribute;

  // tslint:disable-next-line:no-eval
  return eval('object' + selector);
}

const processScopeSelector = (
  rootState: RootState,
  viewId: number,
  componentData: ComponentData,
  select: ScopeSelect
) => {
  const state = selectPresenterState(rootState);
  switch (select.scope) {
    case 'route':
      const paramMap = buildAllParamMaps(rootState.router.state.root);
      return paramMap[select.select];
    case 'global':
      return selectGlobalVariable(select.select)(state);
    case 'view':
      return selectViewVariable(viewId, select.select)(state);
    case 'local':
      return componentData.local && select.select in componentData.local
        ? componentData.local[select.select]
        : null;
    default:
      break;
  }
};

function buildAllParamMaps(router: ActivatedRouteSnapshot): Dictionary<string> {
  const childrenParamMaps = router.children.reduce(
    (childrenParams, child) => ({
      ...childrenParams,
      ...buildAllParamMaps(child)
    }),
    {}
  );

  return {
    ...childrenParamMaps,
    ...router.params
  };
}
