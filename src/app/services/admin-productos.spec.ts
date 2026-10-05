import { TestBed } from '@angular/core/testing';
import { AdminProductos } from './admin-productos';

describe('AdminProductos', () => {
  let service: AdminProductos;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminProductos);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
