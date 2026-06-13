import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/toast.component';
import { ConfirmDialogComponent } from './shared/confirm-dialog.component';
import { ThemeService } from './core/theme/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, ToastComponent, ConfirmDialogComponent],
  template: `
    <router-outlet></router-outlet>
    <app-toasts></app-toasts>
    <app-confirm-dialog></app-confirm-dialog>
  `,
})
export class App {
  // Initialize the theme at startup so it applies app-wide (incl. the login screen).
  private theme = inject(ThemeService);
}
