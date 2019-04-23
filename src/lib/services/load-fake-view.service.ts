import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { selectNextViewId, selectViewById } from '../state/presenter.selectors';
import { CreateView, LoadView, DestroyView } from '../state/presenter.actions';
import { ViewState } from '../presenter.model';
import { PresenterState } from '../state/presenter.reducer';
import { Dictionary } from '@ngrx/entity';

@Injectable({
  providedIn: 'root'
})
export class LoadFakeViewService {
  fakeViews: Dictionary<Observable<ViewState>> = {};

  constructor(private store: Store<PresenterState>) {}

  public loadView(view: string): Observable<ViewState> {
    if (!this.fakeViews[view]) {
      this.fakeViews[view] = new Observable(observer => {
        let viewId: number;
        const sub2 = this.store
          .select(selectNextViewId)
          .subscribe(nextViewId => {
            if (viewId != null) {
              return;
            }

            viewId = nextViewId;

            this.store.dispatch(new CreateView({ view: view }));

            let loadRequested = false;
            const sub1 = this.store
              .select(selectViewById(viewId))
              .subscribe(data => {
                if (!loadRequested && data) {
                  loadRequested = true;

                  this.store.dispatch(
                    new LoadView({
                      view: view,
                      viewId: viewId,
                      data: data.response
                    })
                  );
                }
                observer.next(data);
              });
          });
      });
    }

    return this.fakeViews[view];
  }
}
