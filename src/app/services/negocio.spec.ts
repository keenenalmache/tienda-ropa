import { TestBed } from '@angular/core/testing';
import { Negocio } from './negocio';

describe('Negocio', () => {
  let service: Negocio;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Negocio);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
