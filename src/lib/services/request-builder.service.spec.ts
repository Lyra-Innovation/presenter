import { TestBed } from '@angular/core/testing';

import { RequestBuilderService } from './request-builder.service';

describe('RequestBuilderService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RequestBuilderService = TestBed.get(RequestBuilderService);
    expect(service).toBeTruthy();
  });
});
