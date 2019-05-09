import { TestBed } from '@angular/core/testing';
import { Router, RouterEvent } from '@angular/router';
import {
  routerReducer,
  RouterReducerState,
  StoreRouterConnectingModule,
  RouterAction,
} from '@ngrx/router-store';
import { select, Store, ActionsSubject } from '@ngrx/store';
import { withLatestFrom, filter } from 'rxjs/operators';

import { createTestModule } from './utils';

describe('Router Store Module', () => {
  describe('with defining state key', () => {
    const customStateKey = 'router-reducer';
    let storeRouterConnectingModule: StoreRouterConnectingModule;
    let store: Store<State>;
    let router: Router;

    interface State {
      [customStateKey]: RouterReducerState;
    }

    beforeEach(() => {
      createTestModule({
        reducers: {
          [customStateKey]: routerReducer,
        },
        config: {
          stateKey: customStateKey,
        },
      });

      store = TestBed.get(Store);
      router = TestBed.get(Router);
      storeRouterConnectingModule = TestBed.get(StoreRouterConnectingModule);
    });

    it('should have custom state key as own property', () => {
      expect((<any>storeRouterConnectingModule).stateKey).toBe(customStateKey);
    });

    it('should call navigateIfNeeded with args selected by custom state key', (done: any) => {
      let logs: any[] = [];
      store
        .pipe(
          select(customStateKey),
          withLatestFrom(store)
        )
        .subscribe(([routerStoreState, storeState]) => {
          logs.push([routerStoreState, storeState]);
        });

      spyOn(
        storeRouterConnectingModule,
        'navigateIfNeeded' as never
      ).and.callThrough();
      logs = [];

      // this dispatches `@ngrx/router-store/navigation` action
      // and store emits its payload.
      router.navigateByUrl('/').then(() => {
        const actual = (<any>(
          storeRouterConnectingModule
        )).navigateIfNeeded.calls.allArgs();

        expect(actual.length).toBe(1);
        expect(actual[0]).toEqual(logs[0]);
        done();
      });
    });
  });

  describe('with defining state selector', () => {
    const customStateKey = 'routerReducer';
    const customStateSelector = (state: State) => state.routerReducer;

    let storeRouterConnectingModule: StoreRouterConnectingModule;
    let store: Store<State>;
    let router: Router;

    interface State {
      [customStateKey]: RouterReducerState;
    }

    beforeEach(() => {
      createTestModule({
        reducers: {
          [customStateKey]: routerReducer,
        },
        config: {
          stateKey: customStateSelector,
        },
      });

      store = TestBed.get(Store);
      router = TestBed.get(Router);
      storeRouterConnectingModule = TestBed.get(StoreRouterConnectingModule);
    });

    it('should have same state selector as own property', () => {
      expect((<any>storeRouterConnectingModule).stateKey).toBe(
        customStateSelector
      );
    });

    it('should call navigateIfNeeded with args selected by custom state selector', (done: any) => {
      let logs: any[] = [];
      store
        .pipe(
          select(customStateSelector),
          withLatestFrom(store)
        )
        .subscribe(([routerStoreState, storeState]) => {
          logs.push([routerStoreState, storeState]);
        });

      spyOn(
        storeRouterConnectingModule,
        'navigateIfNeeded' as never
      ).and.callThrough();
      logs = [];

      // this dispatches `@ngrx/router-store/navigation` action
      // and store emits its payload.
      router.navigateByUrl('/').then(() => {
        const actual = (<any>(
          storeRouterConnectingModule
        )).navigateIfNeeded.calls.allArgs();

        expect(actual.length).toBe(1);
        expect(actual[0]).toEqual(logs[0]);
        done();
      });
    });
  });

  describe('onlyEventNavigationId', () => {
    function setup(onlyEventNavigationId: boolean) {
      createTestModule({
        reducers: {},
        config: {
          onlyEventNavigationId,
        },
      });

      const actions: ActionsSubject = TestBed.get(ActionsSubject);
      const router: Router = TestBed.get(Router);
      return { actions, router };
    }

    const onlyRouterActions = (a: any): a is RouterAction<any, any> =>
      a.payload && a.payload.event;

    it('false should dispatch the full event', async () => {
      const { actions, router } = setup(false);
      actions
        .pipe(filter(onlyRouterActions))
        .subscribe(({ payload }) =>
          expect(payload.event instanceof RouterEvent).toBe(true)
        );

      await router.navigateByUrl('/');
    });

    it('true should dispatch the navidation id', async () => {
      const { actions, router } = setup(true);
      actions.pipe(filter(onlyRouterActions)).subscribe(({ payload }: any) => {
        expect(payload.event instanceof RouterEvent).toBe(false);
        expect(payload.event).toEqual({ id: 1 });
      });

      await router.navigateByUrl('/');
    });
  });
});
