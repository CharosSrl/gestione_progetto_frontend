import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { SpinnerComponent } from '../../shared/spinner.component';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SpinnerComponent],
  template: `
    <div class="screen">
      <div class="card login">
        <div class="logo">🚀</div>
        <h1>Lifecycle</h1>
        <p class="muted tag">
          Track your products from idea to launch — features, sprints, tasks and KPIs, all in one calm place.
        </p>

        <button type="button" class="btn btn-primary google" (click)="signIn()" [disabled]="busy()">
          @if (busy()) {
            <app-spinner [inline]="true" />
          } @else {
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5C29.6 34.6 26.9 36 24 36c-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.5 5.5C41.8 35.9 44 30.5 44 24c0-1.3-.1-2.3-.4-3.5z"/>
            </svg>
            Continue with Google
          }
        </button>

        <p class="faint fine">Single-user workspace · your data stays in your account.</p>
      </div>
    </div>
  `,
  styles: [`
    .screen {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .login {
      width: 100%;
      max-width: 400px;
      text-align: center;
      padding: 40px 32px;
      border-radius: var(--r-xl);
      box-shadow: var(--shadow-lg);
    }
    .logo {
      font-size: 52px;
      line-height: 1;
      margin-bottom: 10px;
    }
    h1 { font-size: 30px; margin-bottom: 8px; }
    .tag { margin: 0 auto 28px; max-width: 32ch; }
    .google {
      width: 100%;
      background: var(--surface);
      color: var(--text);
      border: 1.5px solid var(--border-strong);
      box-shadow: var(--shadow-sm);
      min-height: 46px;
    }
    .google:hover:not(:disabled) {
      border-color: var(--primary);
      box-shadow: var(--shadow-md);
    }
    .fine { font-size: 12px; margin: 20px 0 0; }
  `],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private notify = inject(NotificationService);

  readonly busy = signal(false);

  async signIn(): Promise<void> {
    this.busy.set(true);
    try {
      await this.auth.loginWithGoogle();
      await this.router.navigate(['/products']);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        this.notify.error('Sign-in failed. Please try again.');
      }
    } finally {
      this.busy.set(false);
    }
  }
}
