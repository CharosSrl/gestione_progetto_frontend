import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', redirectTo: 'products', pathMatch: 'full' },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/products.component').then((m) => m.ProductsComponent),
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import('./features/product/product-workspace.component').then(
            (m) => m.ProductWorkspaceComponent,
          ),
        children: [
          { path: '', redirectTo: 'features', pathMatch: 'full' },
          {
            path: 'features',
            loadComponent: () =>
              import('./features/product/features/features.component').then(
                (m) => m.FeaturesComponent,
              ),
          },
          {
            path: 'sprints',
            loadComponent: () =>
              import('./features/product/sprints/sprints.component').then(
                (m) => m.SprintsComponent,
              ),
          },
          {
            path: 'kpis',
            loadComponent: () =>
              import('./features/product/kpis/kpis.component').then((m) => m.KpisComponent),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
