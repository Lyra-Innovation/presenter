import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import {
  PresenterActionTypes,
  LoadViewConfig,
  LoadViewConfigSuccess,
  LoadView,
  NavigateRoute,
  ClearActionQueue,
  RegisterViewRequest,
  RequestStateSuccess,
  RequestState,
  RequestStateError,
  ShowNotification,
  createAction,
  ModelAction,
  LoginAction,
  LoginSuccess,
  LoginError,
  LogoutAction
} from './presenter.actions';
import {
  map,
  switchMap,
  catchError,
  delay,
  mergeMap,
  tap,
  withLatestFrom,
  filter,
  take,
  retry,
  debounce,
  debounceTime
} from 'rxjs/operators';
import { BackendService } from '../services/backend.service';
import { of, combineLatest, from } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { RouteConfigurerService } from '../services/route-configurer.service';
import { RequestBuilderService } from '../services/request-builder.service';
import { Store, Action } from '@ngrx/store';
import { PresenterState, RootState } from './presenter.reducer';
import { selectRootState, processDataSelector } from './presenter.selectors';
import { MatSnackBar } from '@angular/material';
import { RouterNavigationAction } from '@ngrx/router-store';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';

@Injectable()
export class PresenterEffects {
  @Effect()
  loadViewConfig$ = this.actions$.pipe(
    ofType<LoadViewConfig>(PresenterActionTypes.LoadViewConfig),
    switchMap(action => this.backendService.loadViewConfig()),
    tap(config => this.routeConfigurer.configureViewRoutes(config)),
    map(config => new LoadViewConfigSuccess({ config: config }))
  );

  @Effect()
  loadView$ = this.actions$.pipe(
    ofType<LoadView>(PresenterActionTypes.LoadView),
    mergeMap(action =>
      combineLatest(
        of(action),
        this.store
          .select(selectRootState)
          .pipe(filter((rootState: RootState) => rootState.router != null))
      ).pipe(take(1))
    ),
    mergeMap(([action, rootState]: [LoadView, RootState]) => {
      const request = this.requestBuilder.buildRequest(
        rootState,
        action.payload.viewId,
        action.payload.data
      );

      return [
        new RegisterViewRequest({
          viewId: action.payload.viewId,
          request: request
        }),
        new RequestState()
      ];
    })
  );

  @Effect()
  loginAction$ = this.actions$.pipe(
    ofType<LoginAction>(PresenterActionTypes.LoginAction),
    switchMap(action =>
      this.backendService.login(action.payload).pipe(
        tap(response => this.authService.setToken(response.access_token)),
        switchMap(response =>
          this.backendService.getLoggedUserId().pipe(
            tap(me => this.authService.setUserId(me)),
            tap(
              () =>
                action.payload.redirectUrl &&
                this.router.navigateByUrl(action.payload.redirectUrl) &&
                location.reload()
            ),
            map(me => new LoginSuccess({ ...response, id: me }))
          )
        ),
        catchError(err => {
          this.showNotification('CORE.globals.login.failed', null);
          return of(new LoginError());
        })
      )
    )
  );

  @Effect({ dispatch: false })
  logoutAction$ = this.actions$.pipe(
    ofType<LogoutAction>(PresenterActionTypes.LogoutAction),
    tap(action => {
      this.authService.logout();
      this.router.navigateByUrl('/');
      location.reload();
    })
  );

  @Effect()
  modelAction$ = this.actions$.pipe(
    ofType<ModelAction>(PresenterActionTypes.ModelAction),
    switchMap(action => of(new RequestState()))
  );

  @Effect()
  requestViews$ = this.actions$.pipe(
    ofType<RequestState>(PresenterActionTypes.RequestState),
    withLatestFrom(this.store.select(selectRootState)),
    switchMap(([action, rootState]: [RequestState, RootState]) => {
      const {
        request,
        successActions,
        errorMessages
      } = this.requestBuilder.buildViewsRequest(rootState);

      return this.backendService.requestState(request).pipe(
        tap(response =>
          this.routeConfigurer.configureRouteData(response.views)
        ),
        switchMap(response => [
          new RequestStateSuccess(response),
          new ClearActionQueue(),
          ...successActions
        ]),
        //        retry(2)
        catchError(error => {
          console.log(error);
          for (const errorMessage of errorMessages) {
            this.showNotification(
              errorMessage || 'CORE.globals.connection-error',
              null,
              5000
            );
          }
          return of(new RequestStateError({ request: request, error: error }));
        })
      );
    })
  );

  @Effect({ dispatch: false })
  navigateToRoute$ = this.actions$.pipe(
    ofType<NavigateRoute>(PresenterActionTypes.NavigateRoute),
    tap(action => this.router.navigate([action.payload.route]))
  );

  @Effect({ dispatch: false })
  replaceRouteParams$ = this.actions$.pipe(
    ofType<RouterNavigationAction>('@ngrx/router-store/navigation'),
    withLatestFrom(this.store.select(selectRootState)),
    tap(([action, state]: [RouterNavigationAction, RootState]) => {
      let replaced = false;

      const fragments = action.payload.routerState.url.split('/');
      for (let i = 0; i < fragments.length; i++) {
        if (fragments[i].includes(':')) {
          let dataSelector: any;
          const selectors = fragments[i].split(':').filter(s => s !== '');

          if (selectors.length === 1) {
            dataSelector = selectors[0];
          } else {
            dataSelector = {};
            for (const selector of selectors) {
              const selectorParams = selector.split('=');
              dataSelector[selectorParams[0]] = selectorParams[1];
            }
          }

          fragments[i] = processDataSelector(state, null, null, dataSelector);
          replaced = true;
        }
      }

      if (replaced) {
        this.router.navigateByUrl(fragments.join('/'));
      }
    })
  );

  @Effect({ dispatch: false })
  showNotification$ = this.actions$.pipe(
    ofType<ShowNotification>(PresenterActionTypes.ShowNotification),
    tap(action =>
      this.showNotification(
        action.payload.message,
        action.payload.action,
        action.payload.duration
      )
    )
  );

  showNotification(
    message: string,
    action: { title: string; event: any },
    duration: number = 3000
  ) {
    const snackBarAction = action
      ? this.translateService.instant(action.title)
      : null;
    const snackBarRef = this.snackBar.open(
      this.translateService.instant(message),
      snackBarAction,
      {
        duration: duration ? duration : 3000
      }
    );
    snackBarRef
      .onAction()
      .subscribe(() =>
        this.store.dispatch(
          createAction(action.event.action, action.event.params)
        )
      );
  }

  constructor(
    private actions$: Actions,
    private backendService: BackendService,
    private authService: AuthService,
    private routeConfigurer: RouteConfigurerService,
    private requestBuilder: RequestBuilderService,
    private store: Store<PresenterState>,
    private router: Router,
    private snackBar: MatSnackBar,
    private translateService: TranslateService
  ) {}
}
