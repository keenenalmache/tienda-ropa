import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin-guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/inicio/inicio').then((m) => m.Inicio) },
  { path: 'catalogo', loadComponent: () => import('./pages/catalogo/catalogo').then((m) => m.Catalogo) },
  {
    path: 'producto/:id',
    loadComponent: () => import('./pages/detalle-producto/detalle-producto').then((m) => m.DetalleProducto),
  },
  { path: 'contacto', loadComponent: () => import('./pages/contacto/contacto').then((m) => m.Contacto) },
  { path: 'login', loadComponent: () => import('./pages/login/login').then((m) => m.Login) },
  { path: 'recuperar', loadComponent: () => import('./pages/recuperar/recuperar').then((m) => m.Recuperar) },
  {
    path: 'restablecer',
    loadComponent: () => import('./pages/restablecer/restablecer').then((m) => m.Restablecer),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/admin').then((m) => m.Admin),
  },
  { path: 'privacidad', loadComponent: () => import('./pages/privacidad/privacidad').then((m) => m.Privacidad) },
  {
    path: 'carrito',
    loadComponent: () => import('./pages/carrito/carrito').then((m) => m.CarritoPagina),
  },
  {
    path: '**',
    loadComponent: () => import('./pages/no-encontrada/no-encontrada').then((m) => m.NoEncontrada),
  },
];