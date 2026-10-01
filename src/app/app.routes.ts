import { Routes } from '@angular/router';
import { Inicio } from './pages/inicio/inicio';
import { Catalogo } from './pages/catalogo/catalogo';
import { DetalleProducto } from './pages/detalle-producto/detalle-producto';
import { Contacto } from './pages/contacto/contacto';

export const routes: Routes = [
  { path: '', component: Inicio },
  { path: 'catalogo', component: Catalogo },
  { path: 'producto/:id', component: DetalleProducto },
  { path: 'contacto', component: Contacto },
  { path: '**', redirectTo: '' },
];