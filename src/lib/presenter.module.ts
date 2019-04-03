import { NgModule, APP_INITIALIZER, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule, Store } from '@ngrx/store';
import { StoreRouterConnectingModule, routerReducer } from '@ngrx/router-store';
import { EffectsModule } from '@ngrx/effects';

import { RendererModule } from 'renderer';

import * as fromPresenter from './state/presenter.reducer';
import { LoadViewConfig, LoginSuccess } from './state/presenter.actions';
import { PresenterEffects } from './state/presenter.effects';
import { ViewContainerComponent } from './containers/view-container/view-container.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { isConfigLoaded } from './state/presenter.selectors';
import { ApiInterceptor } from './services/api-interceptor.service';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from './services/auth.service';
import { LoadFakeViewService } from './services/load-fake-view.service';
import { BASE_API_URL } from './presenter.model';
import { APP_BASE_HREF } from '@angular/common';

export function initApplication(
  store: Store<fromPresenter.PresenterState>,
  auth: AuthService
): () => void {
  return () =>
    new Promise(resolve => {
      if (auth.isAuthenticated()) {
        store.dispatch(
          new LoginSuccess({
            id: auth.getUserId(),
            token_type: 'bearer',
            access_token: auth.getToken(),
            expires_in: 0
          })
        );
      }
      store.dispatch(new LoadViewConfig());
      const subs = store.select(isConfigLoaded).subscribe(loaded => {
        if (loaded) {
          subs.unsubscribe();
          resolve();
        }
      });
    });
}

export function getBaseUrl() {
  return document.getElementsByTagName('base')[0].href;
}

@NgModule({
  declarations: [ViewContainerComponent],
  imports: [
    CommonModule,
    RendererModule,
    StoreModule.forFeature('presenter', {
      presenter: fromPresenter.reducer,
      router: routerReducer
    }),
    HttpClientModule,
    StoreRouterConnectingModule.forRoot(),
    EffectsModule.forFeature([PresenterEffects])
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initApplication,
      multi: true,
      deps: [Store, AuthService]
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ApiInterceptor,
      multi: true
    },
    { provide: APP_BASE_HREF, useFactory: getBaseUrl }
  ],
  entryComponents: [ViewContainerComponent],
  exports: [ViewContainerComponent, TranslateModule]
})
export class PresenterModule {
  static forRoot(config: { baseApiUrl?: string }): ModuleWithProviders {
    return {
      ngModule: PresenterModule,
      providers: [
        LoadFakeViewService,
        {
          provide: BASE_API_URL,
          useValue: config.baseApiUrl
        }
      ]
    };
  }
}
