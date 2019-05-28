import {
  EntityState,
  EntityAdapter,
  createEntityAdapter,
  Update
} from '@ngrx/entity';
import * as _ from 'lodash';

import { PresenterActions, PresenterActionTypes } from './presenter.actions';

import { Dictionary, LayoutData } from 'renderer';
import {
  ViewState,
  ViewConfig,
  ViewRequest,
  ActionRequest
} from '../presenter.model';
import { RouterReducerState } from '@ngrx/router-store';

export interface ViewsState extends EntityState<ViewState> {
  currentViews: number[];
  nextStateId: number;
}

export interface RootState {
  router: RouterReducerState;
  presenter: PresenterState;
}

export interface PresenterState {
  config: Dictionary<ViewConfig>;
  viewData: ViewsState;
  models: Dictionary<Dictionary<any>>;
  loggedUser: {
    id: number;
  };

  globalVariables: Dictionary<any>;

  actionQueue: Array<ActionRequest>;
}

const selectRequestId = (viewRequest: ViewRequest) =>
  JSON.stringify(viewRequest);

export const adapter: EntityAdapter<ViewState> = createEntityAdapter<
  ViewState
>();

export const initialState: PresenterState = {
  config: null,
  viewData: adapter.getInitialState({
    currentViews: [],
    nextStateId: 0
  }),
  loggedUser: null,
  models: {},

  globalVariables: {},
  actionQueue: []
};

export function reducer(
  state = initialState,
  action: PresenterActions
): PresenterState {
  // console.log('[STATE]', state);
  // console.log('[ACTION]', action);
  switch (action.type) {
    case PresenterActionTypes.LoginSuccess:
      return { ...state, loggedUser: action.payload };
    case PresenterActionTypes.LogoutAction:
      return { ...state, loggedUser: null };
    case PresenterActionTypes.LoadViewConfigSuccess:
      return { ...state, config: action.payload.config };
    case PresenterActionTypes.CreateView:
      return {
        ...state,
        viewData: adapter.addOne(
          {
            id: state.viewData.nextStateId,
            view: action.payload.view,
            request: null,
            loading: false,
            response: null,
            error: null,
            variables: {}
          },
          {
            ...state.viewData,
            nextStateId: state.viewData.nextStateId + 1,
            currentViews: [
              ...state.viewData.currentViews,
              state.viewData.nextStateId
            ]
          }
        )
      };
    case PresenterActionTypes.DestroyView:
      return {
        ...state,
        viewData: adapter.removeOne(action.payload.viewId, {
          ...state.viewData,
          currentViews: state.viewData.currentViews.filter(
            viewId => viewId !== action.payload.viewId
          )
        })
      };
    case PresenterActionTypes.LoadView:
      return {
        ...state,
        viewData: adapter.updateOne(
          {
            id: action.payload.viewId,
            changes: {
              loading: true,
              error: null
            }
          },
          state.viewData
        )
      };
    case PresenterActionTypes.RegisterViewRequest:
      return {
        ...state,
        viewData: adapter.updateOne(
          {
            id: action.payload.viewId,
            changes: {
              request: action.payload.request
            }
          },
          state.viewData
        )
      };
    case PresenterActionTypes.RequestStateSuccess:
      const layoutStates: Dictionary<LayoutData> = action.payload.views;
      const updates: Update<ViewState>[] = Object.keys(layoutStates).map(
        viewKey => ({
          id: viewKey,
          changes: {
            loading: false,
            response: layoutStates[viewKey]
          }
        })
      );

      return {
        ...state,
        viewData: adapter.updateMany(updates, state.viewData),
        models: _.merge(state.models, action.payload.models)
      };
    case PresenterActionTypes.RequestStateError:
      const requestedViewsState: Dictionary<ViewRequest> =
        action.payload.request.views;
      const errorUpdates: Update<ViewState>[] = Object.keys(
        requestedViewsState
      ).map(viewKey => ({
        id: viewKey,
        changes: {
          loading: false,
          error: action.payload.error
        }
      }));

      return {
        ...state,
        viewData: adapter.updateMany(errorUpdates, state.viewData)
      };

    case PresenterActionTypes.SetVariable:
      let newState;
      if (action.payload.viewName) {
        newState = {
          viewData: {
            entities: {
              [action.payload.viewName]: {
                variables: {
                  [action.payload.name]: action.payload.value
                }
              }
            }
          }
        };
      } else {
        newState = {
          globalVariables: {
            [action.payload.name]: action.payload.value
          }
        };
      }
      return {
        ..._.merge(state, newState)
      };

    case PresenterActionTypes.ModelAction:
      return { ...state, actionQueue: [...state.actionQueue, action.payload] };

    case PresenterActionTypes.ClearActionQueue:
      return { ...state, actionQueue: [] };

    default:
      return state;
  }
}

// get the selectors
export const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal
} = adapter.getSelectors();
