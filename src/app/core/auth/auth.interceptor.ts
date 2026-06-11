import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { NotificationService } from '../services/notification.service';
import { ApiErrorBody } from '../models/models';

/**
 * Attaches the Firebase ID token to outgoing API requests and surfaces API
 * errors. On 401 it signs the user out and bounces to the login screen.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const notify = inject(NotificationService);

  // Public endpoints don't need a token.
  if (req.url.includes('/health')) {
    return next(req);
  }

  return from(auth.getToken()).pipe(
    switchMap((token) => {
      const authReq = token
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;

      return next(authReq).pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status === 401) {
            void auth.logout().finally(() => router.navigate(['/login']));
            notify.error('Your session expired. Please sign in again.');
          } else {
            notify.error(messageFor(err));
          }
          return throwError(() => err);
        }),
      );
    }),
  );
};

function messageFor(err: HttpErrorResponse): string {
  const body = err.error as ApiErrorBody | undefined;
  if (body?.message) {
    return body.message;
  }
  if (err.status === 0) {
    return 'Cannot reach the server. Check your connection or the API URL.';
  }
  if (err.status === 404) {
    return 'Not found.';
  }
  return `Something went wrong (${err.status}).`;
}
