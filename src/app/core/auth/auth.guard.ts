import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { map, take } from 'rxjs';

/**
 * Gates protected routes. Waits for Firebase to resolve the first auth state
 * (avoids a redirect flicker on hard refresh) before allowing or redirecting.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return user(auth).pipe(
    take(1),
    map((u) => (u ? true : router.createUrlTree(['/login']))),
  );
};

/** Inverse guard: keeps signed-in users off the login page. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return user(auth).pipe(
    take(1),
    map((u) => (u ? router.createUrlTree(['/products']) : true)),
  );
};
