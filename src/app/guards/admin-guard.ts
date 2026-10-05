import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);
  if (await auth.haySesion()) return true;
  return router.createUrlTree(['/login']);
};