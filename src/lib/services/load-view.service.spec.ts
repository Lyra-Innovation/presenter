import { TestBed } from '@angular/core/testing';

import { LoadFakeViewService } from './load-fake-view.service';

describe('LoadFakeViewService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: LoadFakeViewService = TestBed.get(LoadFakeViewService);
    expect(service).toBeTruthy();
  });
});
