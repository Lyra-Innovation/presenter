import { Action } from '@ngrx/store';
import { Dictionary, ViewData, LayoutData } from 'renderer';
import {
  ViewConfig,
  ActionRequest,
  ViewRequest,
  StateResponse,
  StateRequest,
  EventConfig,
  LoginRequest,
  LoginResponse
} from '../presenter.model';

export enum PresenterActionTypes {
  LoginAction = '[Presenter] Login Action',
  LoginSuccess = '[Presenter] Login Success',
  LoginError = '[Presenter] Login Error',
  LogoutAction = '[Presenter] Logout Action',

  LoadViewConfig = '[Presenter] Load View Config',
  LoadViewConfigSuccess = '[Presenter] Load View Config Success',

  CreateView = '[Presenter] Create View',
  DestroyView = '[Presenter] Destroy View',

  LoadView = '[Presenter] Load View',
  RegisterViewRequest = '[Presenter] Register View Request',

  ModelAction = '[Presenter] Model Action',
  ClearActionQueue = '[Presenter] Clear Action Queue',

  RequestState = '[Presenter] Request State',
  RequestStateSuccess = '[Presenter] Request State Success',
  RequestStateError = '[Presenter] Request State Error',

  SetVariable = '[Presenter] Set Variable',
  NavigateRoute = '[Presenter] Navigate to route',
  ShowNotification = '[Presenter] Show Notification'
}

export class LoginAction implements Action {
  readonly type = PresenterActionTypes.LoginAction;

  constructor(public payload: LoginRequest) {}
}
export class LoginSuccess implements Action {
  readonly type = PresenterActionTypes.LoginSuccess;

  constructor(public payload: LoginResponse) {}
}

export class LogoutAction implements Action {
  readonly type = PresenterActionTypes.LogoutAction;
}

export class LoginError implements Action {
  readonly type = PresenterActionTypes.LoginError;
}

export class ModelAction implements Action {
  readonly type = PresenterActionTypes.ModelAction;

  constructor(public payload: ActionRequest) {}
}

export class ClearActionQueue implements Action {
  readonly type = PresenterActionTypes.ClearActionQueue;
}

export class CreateView implements Action {
  readonly type = PresenterActionTypes.CreateView;
  constructor(public payload: { view: string }) {}
}

export class DestroyView implements Action {
  readonly type = PresenterActionTypes.DestroyView;
  constructor(public payload: { viewId: number }) {}
}

export class LoadViewConfig implements Action {
  readonly type = PresenterActionTypes.LoadViewConfig;
}

export class LoadViewConfigSuccess implements Action {
  readonly type = PresenterActionTypes.LoadViewConfigSuccess;

  constructor(public payload: { config: Dictionary<ViewConfig> }) {}
}

export class LoadView implements Action {
  readonly type = PresenterActionTypes.LoadView;

  constructor(
    public payload: { view: string; viewId: number; data: LayoutData }
  ) {}
}

export class RegisterViewRequest implements Action {
  readonly type = PresenterActionTypes.RegisterViewRequest;

  constructor(public payload: { viewId: number; request: ViewRequest }) {}
}

export class RequestState implements Action {
  readonly type = PresenterActionTypes.RequestState;

  // Redirect url after the state is retrieved succesfully
  constructor(public payload?: string) {}
}

export class RequestStateSuccess implements Action {
  readonly type = PresenterActionTypes.RequestStateSuccess;

  constructor(public payload: StateResponse) {}
}

export class RequestStateError implements Action {
  readonly type = PresenterActionTypes.RequestStateError;

  constructor(public payload: { request: StateRequest; error: any }) {}
}

export class SetVariable implements Action {
  readonly type = PresenterActionTypes.SetVariable;

  constructor(
    public payload: {
      viewName?: string;
      name: string;
      value: any;
    }
  ) {}
}

export class NavigateRoute implements Action {
  readonly type = PresenterActionTypes.NavigateRoute;

  constructor(public payload: { route: string }) {}
}

export class ShowNotification implements Action {
  readonly type = PresenterActionTypes.ShowNotification;

  // Duration is in ms (default 3000)
  constructor(
    public payload: {
      message: string;
      action?: { title: string; event: EventConfig };
      duration?: number;
    }
  ) {
    if (!payload.duration) {
      payload.duration = 3000;
    }
  }
}

export type PresenterActions =
  | LoginAction
  | LogoutAction
  | LoginSuccess
  | LoginError
  | ModelAction
  | ClearActionQueue
  | CreateView
  | DestroyView
  | LoadViewConfig
  | LoadViewConfigSuccess
  | LoadView
  | RegisterViewRequest
  | RequestState
  | RequestStateSuccess
  | RequestStateError
  | SetVariable
  | NavigateRoute
  | ShowNotification;

export function createAction(
  actionName: string,
  payload: any
): PresenterActions {
  switch (actionName) {
    case 'LoginAction':
      return new LoginAction(payload);
    case 'LogoutAction':
      return new LogoutAction();
    case 'ModelAction':
      return new ModelAction(payload);
    case 'SetVariable':
      return new SetVariable(payload);
    case 'NavigateRoute':
      return new NavigateRoute(payload);
    case 'ShowNotification':
      return new ShowNotification(payload);

    default:
      throw new Error(
        `[PRESENTER ERROR] No action registered with name ${actionName}`
      );
  }
}
