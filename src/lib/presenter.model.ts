import { Dictionary } from '@ngrx/entity';
import { LayoutData, ViewData, SelectConfig, EventData } from 'renderer';
import { InjectionToken } from '@angular/core';

export const BASE_API_URL = new InjectionToken<string>(
  'BASE API URL'
);

/**
 * GLOBALS
 */

export interface ViewState {
  id: number;
  view: string;

  request: ViewRequest;
  loading: boolean;
  response: LayoutData;
  error: any;

  variables: { [key: string]: any };
}

/**
 * CONFIG
 * Configuration of all the layouts of the application, received from the backend
 */

export enum CoreCapability {
  public,
  private
}

export interface EventConfig {
  params?: SelectConfig | any;
  action?: string;
  bubble?: string;
}

export interface InputConfig {
  name: string;
  op?: string;
  value?: any;
  selectFrom?: SelectConfig;
}

export type ValueConfig =
  | string
  | { default: string }
  | SelectConfig
  | {
      query: Query;
    };

export interface CustomQuery {
  class: string;
  attribute?: string;
  function: string;
  inputs: Array<InputConfig>;
  build?: {
    orderBy: string;
    take: number;
  };
}

export interface ModelQuery {
  model: string;
  attribute: string;
  function: string;
  inputs: Array<InputConfig>;
  build?: {
    orderBy: string;
    take: number;
  };
}

export type Query = CustomQuery | ModelQuery;

export interface ComponentConfig {
  type: string; // The component that this config will render
  values: Dictionary<ValueConfig>;

  events?: Dictionary<EventConfig[]>;
  route?: string;

  multiple?: boolean;
}

export interface LayoutConfig<CHILDREN extends string = any>
  extends ComponentConfig {
  children: { [child in CHILDREN]: LayoutConfig | ComponentConfig };
}

export interface ViewConfig {
  view: string; // The name of the view in which this layout will be shown
  capabilities: CoreCapability[];
  baseRoute?: string;

  layout: LayoutConfig;
}

/**
 * REQUEST
 */

/** Concrete data for each layout, holding the request parameters to identify it */

export interface ComponentRequest {
  params: Dictionary<Dictionary<any>>;
}

export interface LayoutRequest extends ComponentRequest {
  children: Dictionary<LayoutRequest | ComponentRequest>;
}

export interface ViewRequest {
  view: string;
  layout: LayoutRequest;
}

export interface StateRequest {
  views: Dictionary<ViewRequest>;
  actions?: ActionRequest[];
}

export interface ActionRequest {
  action: 'create' | 'update' | 'delete';
  model: string;
  params: Dictionary<any>;
  where: Dictionary<any>;

  condition?: CustomQuery;

  successActions?: Array<EventData>;
  errorMessage?: string;
}

/**
 * RESPONSE
 */

export type ModelState = Dictionary<Dictionary<any>>;

export interface StateResponse {
  views: Dictionary<LayoutData>;
  models: ModelState;
}

/**
 * LOGIN
 */

export interface LoginRequest {
  username: string;
  password: string;

  redirectUrl?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  id: number;
}
