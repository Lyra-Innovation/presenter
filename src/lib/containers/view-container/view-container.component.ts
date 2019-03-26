import {
  Component,
  OnInit,
  Input,
  OnDestroy,
  HostBinding,
  ViewEncapsulation
} from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import * as fromPresenter from '../../state/presenter.reducer';
import {
  LoadView,
  createAction,
  CreateView,
  DestroyView
} from '../../state/presenter.actions';
import { ActivatedRoute } from '@angular/router';
import { ViewState, LayoutRequest, ViewConfig } from '../../presenter.model';
import { EventBinding, Dictionary, EventData } from 'renderer';
import {
  selectViewById,
  selectNextViewId,
  selectPresenterState
} from '../../state/presenter.selectors';

@Component({
  selector: 'pre-view-container',
  templateUrl: './view-container.component.html',
  styleUrls: ['./view-container.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ViewContainerComponent implements OnInit, OnDestroy {
  viewId: number;

  @Input()
  view: string;

  @Input()
  customEvents: EventBinding[] = [];

  subscriptions: Subscription[] = [];

  @HostBinding('class')
  classes = 'renderer-view-container renderer-fill';

  data: ViewState;
  config: ViewConfig;

  constructor(
    private store: Store<fromPresenter.RootState>,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    if (this.route.snapshot.data.viewConfig) {
      this.view = this.route.snapshot.data.viewConfig.view;
    }

    const sub2 = this.store.select(selectNextViewId).subscribe(nextViewId => {
      if (this.viewId != null) {
        return;
      }

      this.viewId = nextViewId;

      this.store.dispatch(new CreateView({ view: this.view }));

      let loadRequested = false;
      const sub1 = this.store
        .select(selectViewById(this.viewId))
        .subscribe(data => {
          if (!loadRequested) {
            loadRequested = true;

            this.store.dispatch(
              new LoadView({
                view: this.view,
                viewId: this.viewId,
                data: data.response
              })
            );
          }
          this.data = data;
        });

      this.subscriptions.push(sub1);
    });
    this.subscriptions.push(sub2);
  }

  /**
   * Dispatch an action with the given name and params to the store
   */
  handleDispatchAction($event: EventData) {
    this.store.dispatch(createAction($event.action, $event.params));
  }

  ngOnDestroy() {
    this.store.dispatch(new DestroyView({ viewId: this.viewId }));
  }

  getStatus(): 'loading' | 'error' | 'response' {
    if (this.data && this.data.response) {
      return 'response';
    } else if (this.data && !this.data.loading && this.data.error) {
      return 'error';
    } else {
      return 'loading';
    }
  }
}
