---
name: angular-project
description: >
  Use this skill any time the user wants to create, scaffold, or build an Angular application,
  add features to an Angular project, set up routing, services, guards, interceptors, state management,
  or configure security. Also trigger for Angular-specific questions about components, signals, lazy loading,
  JWT authentication, project structure, or environment setup. Always use this skill when the user mentions
  "Angular", "ng new", "Angular component", "Angular service", "Angular routing", or asks to start a
  frontend project and Angular is the chosen framework. If the user hasn't specified a framework and is
  starting a new web frontend project, ask if they want Angular, then use this skill.
---

# Angular Project Skill

Modern Angular (v17+) best practices: standalone components, signals, JWT security, lazy loading.

---

## Step 0 — Ask About Hosting (REQUIRED, every time)

**Before writing any code**, ask:

> "Do you want to set up **Netlify** and/or **Firebase** for this project?
> - Netlify → CI/CD, hosting, serverless functions
> - Firebase → Realtime DB / Firestore, Auth, Hosting, Cloud Functions
> - Both
> - Neither (local / custom backend)"

If they say yes to Netlify → read `references/netlify.md` and follow it.
If they say yes to Firebase → read `references/firebase.md` and follow it.
Both → read both reference files.

---

## Project Setup

```bash
ng new <project-name> --standalone --routing --style=scss
cd <project-name>
npm install jwt-decode
```

Use `--standalone` (default in Angular 17+). No NgModules unless the user explicitly wants them.

---

## API Layer — generate from OpenAPI when a spec exists (REQUIRED)

**Before hand-writing any models or HTTP services, check the project root (and
common spots like `api/`, `docs/`, `spec/`) for an OpenAPI document**
(`openapi.yaml` / `openapi.yml` / `openapi.json` / `swagger.yaml`). If one
exists, generate the typed API layer from it instead of writing models and
services by hand — the spec is the source of truth and hand-written DTOs drift.

Use [`@openapitools/openapi-generator-cli`](https://openapi-generator.tech/) with
the `typescript-angular` generator (it emits standalone-friendly, `HttpClient`-
based services + typed models + enums):

```bash
npm install -D @openapitools/openapi-generator-cli
npx openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-angular \
  -o src/app/core/api \
  --additional-properties=ngVersion=20.0.0,providedInRoot=true,fileNaming=kebab-case,withInterfaces=true
```

Add an npm script so the client is regenerated whenever the spec changes:

```jsonc
// package.json
"scripts": {
  "api:gen": "openapi-generator-cli generate -i openapi.yaml -g typescript-angular -o src/app/core/api --additional-properties=ngVersion=20.0.0,providedInRoot=true,fileNaming=kebab-case,withInterfaces=true"
}
```

Wiring rules:
- Provide the generated `BASE_PATH` from `environment.apiUrl`, and register the
  generated `Configuration`/`ApiModule` (or `provideApi`) in `app.config.ts`.
- Treat `src/app/core/api/` as **generated** — never edit by hand; add it to
  `.gitignore` *or* commit it but regenerate via `npm run api:gen` (pick one and
  document it). Re-run codegen after every spec change; don't patch the output.
- Keep app-specific logic (caching, mapping, signals) in thin wrapper services
  under `core/services/` that call the generated clients — don't put business
  logic in generated code.
- Auth/interceptors still apply: the generated services use Angular's
  `HttpClient`, so the JWT/Firebase interceptor attaches tokens automatically.

Only hand-write models/services (per the patterns below) when the project has
**no** OpenAPI spec.

---

## Canonical Folder Structure

```
src/
├── app/
│   ├── core/                    # Singleton services, guards, interceptors
│   │   ├── auth/
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.guard.ts
│   │   │   └── jwt.interceptor.ts
│   │   ├── services/            # App-wide services (http wrappers, etc.)
│   │   └── models/              # Shared interfaces / types
│   ├── shared/                  # Reusable UI: components, pipes, directives
│   │   ├── components/
│   │   ├── directives/
│   │   └── pipes/
│   ├── features/                # Lazy-loaded feature areas
│   │   └── <feature>/
│   │       ├── <feature>.routes.ts
│   │       ├── components/
│   │       └── services/
│   ├── layout/                  # Shell: header, footer, sidebar
│   ├── app.routes.ts
│   ├── app.config.ts
│   └── app.component.ts
├── environments/
│   ├── environment.ts
│   └── environment.production.ts
└── assets/
```

Rules:
- `core/` → singleton services only (`providedIn: 'root'`). **Never** put shared UI here.
- `shared/` → UI components/pipes/directives only. **Never** put services here.
- Every feature folder is independently lazy-loadable.

---

## Component Authoring (Modern Style)

```typescript
// Always standalone: true
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `...`,
})
export class ExampleComponent {
  // Prefer signals over plain properties
  count = signal(0);
  doubled = computed(() => this.count() * 2);

  // inject() over constructor DI
  private authService = inject(AuthService);

  increment() {
    this.count.update(v => v + 1);
  }
}
```

**Key rules:**
- Always `standalone: true`
- Always `ChangeDetectionStrategy.OnPush`
- Use `signal()`, `computed()`, `effect()` (stable in Angular v20) over `BehaviorSubject`
- Use `inject()` instead of constructor injection
- Use `@let` in templates for async data (Angular 18+)

---

## Routing (Lazy Loading)

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
  },
  { path: '**', redirectTo: 'home' },
];
```

- Use `loadComponent` for single-component routes
- Use `loadChildren` for feature route sets
- All protected routes use `canActivate: [authGuard]`

---

## JWT Authentication

### Auth Service (`core/auth/auth.service.ts`)

```typescript
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface TokenPayload {
  sub: string;
  exp: number;
  roles?: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _token = signal<string | null>(this.loadToken());
  readonly isAuthenticated = computed(() => {
    const token = this._token();
    if (!token) return false;
    try {
      const payload = jwtDecode<TokenPayload>(token);
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  });

  readonly currentUser = computed(() => {
    const token = this._token();
    if (!token) return null;
    try { return jwtDecode<TokenPayload>(token); } catch { return null; }
  });

  login(credentials: { email: string; password: string }) {
    return this.http.post<{ accessToken: string; refreshToken: string }>(
      `${environment.apiUrl}/auth/login`, credentials
    ).pipe(
      tap(({ accessToken, refreshToken }) => {
        // SECURITY: Store refresh token in HttpOnly cookie via backend
        // Access token in memory only — avoids XSS exposure
        sessionStorage.setItem('access_token', accessToken);
        this._token.set(accessToken);
      })
    );
  }

  logout() {
    sessionStorage.removeItem('access_token');
    this._token.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this._token();
  }

  private loadToken(): string | null {
    return sessionStorage.getItem('access_token');
  }
}
```

**Security notes:**
- Access token → `sessionStorage` (cleared on tab close, not accessible cross-tab).
- Refresh token → HttpOnly cookie set by the server. Never store in JS.
- If you must use `localStorage`, document the XSS risk explicitly.

---

### JWT Interceptor (`core/auth/jwt.interceptor.ts`)

```typescript
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        auth.logout(); // Token expired or invalid
      }
      return throwError(() => err);
    })
  );
};
```

Use the **functional** interceptor pattern (Angular 15+), not class-based.

---

### Auth Guard (`core/auth/auth.guard.ts`)

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  router.navigate(['/login']);
  return false;
};
```

---

### App Config (`app.config.ts`)

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { jwtInterceptor } from './core/auth/jwt.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([jwtInterceptor])),
  ],
};
```

---

## Security Checklist

Always apply these in every project:

- [ ] `HttpOnly` cookie for refresh token (never expose to JS)
- [ ] `sessionStorage` for access token (not `localStorage` unless documented)
- [ ] All protected routes behind `authGuard`
- [ ] HTTP interceptor attached via `provideHttpClient(withInterceptors([...]))`
- [ ] `environment.apiUrl` used — never hardcode API base URLs
- [ ] Token expiry checked before use (see `isAuthenticated` computed)
- [ ] 401 errors trigger automatic logout
- [ ] Strict TypeScript: no `any` in auth-related code
- [ ] No secrets or API keys in frontend code or environment files committed to git

---

## Environments

```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
};

// environment.production.ts
export const environment = {
  production: true,
  apiUrl: 'https://your-api.example.com/api',
};
```

Add `environments/` to `.gitignore` if it contains secrets. Use CI environment variables instead.

---

## State Management

| Complexity | Solution |
|---|---|
| Component-local | `signal()` |
| Shared simple state | `signal()` in a `providedIn: 'root'` service |
| Complex async flows | NgRx SignalStore or RxJS + signals |
| Heavy enterprise | NgRx full store |

Prefer signals-first for new projects. Introduce NgRx only when signal services become unwieldy.

---

## Performance Defaults

Always enable these:
- `ChangeDetectionStrategy.OnPush` on every component
- `trackBy` or `track` (new `@for` syntax) in all list iterations
- Lazy-load every feature route
- `@defer` for below-the-fold components (Angular 17+):

```html
@defer (on viewport) {
  <app-heavy-chart />
} @placeholder {
  <div class="skeleton"></div>
}
```

---

## Coding Conventions

| Rule | Example |
|---|---|
| File naming | `user-profile.component.ts` |
| Component selector | `app-user-profile` |
| Services | `user.service.ts` → `UserService` |
| Interfaces | `IUser` or `User` (pick one, stay consistent) |
| No `any` | Use `unknown` and narrow |
| Barrel files | `index.ts` per folder only if the folder is public API |

---

## Reference Files

Read these only when needed:
- `references/netlify.md` — Netlify hosting, CI/CD, redirects config
- `references/firebase.md` — Firebase setup: Auth, Firestore, Hosting, Cloud Functions
