import { Routes } from '@angular/router';
import { Inicio } from './pages/inicio/inicio';
import { Catalogo } from './pages/catalogo/catalogo';
import { DetalleProducto } from './pages/detalle-producto/detalle-producto';
import { Contacto } from './pages/contacto/contacto';
import { Login } from './pages/login/login';
import { Admin } from './pages/admin/admin';
import { Recuperar } from './pages/recuperar/recuperar';
import { Restablecer } from './pages/restablecer/restablecer';
import { adminGuard } from './guards/admin-guard';

export const routes: Routes = [
  { path: '', component: Inicio },
  { path: 'catalogo', component: Catalogo },
  { path: 'producto/:id', component: DetalleProducto },
  { path: 'contacto', component: Contacto },
  { path: 'login', component: Login },
  { path: 'recuperar', component: Recuperar },
  { path: 'restablecer', component: Restablecer },
  { path: 'admin', component: Admin, canActivate: [adminGuard] },
  { path: '**', redirectTo: '' },
];