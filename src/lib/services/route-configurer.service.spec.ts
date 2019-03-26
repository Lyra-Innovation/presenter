import { TestBed } from '@angular/core/testing';

import { RouteConfigurerService } from './route-configurer.service';

describe('RouteConfigurerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RouteConfigurerService = TestBed.get(RouteConfigurerService);
    expect(service).toBeTruthy();
  });
});
