import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Dictionary, ViewData } from 'renderer';
import {
  CoreCapability,
  ViewConfig,
  StateRequest,
  StateResponse,
  LoginResponse,
  LoginRequest
} from '../presenter.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  constructor(private http: HttpClient) {}

  /**
   * Logins the given user
   */
  public login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('api/auth/login', {
      name: request.username,
      password: request.password
    });
  }

  /**
   * Loads the configuration for all the layouts in the application
   */
  public getLoggedUserId(): Observable<number> {
    return this.http.post<number>('api/auth/me', {});
  }

  /**
   * Loads the configuration for all the layouts in the application
   */
  public loadViewConfig(): Observable<Dictionary<ViewConfig>> {
    return this.http.get<Dictionary<ViewConfig>>('api/config');
  }

  /**
   * Loads the data for the requested view
   * @param request the request params for the backend query
   */
  public requestState(request: StateRequest): Observable<StateResponse> {
    return this.http.post<StateResponse>('api/view', request);
  }
}
