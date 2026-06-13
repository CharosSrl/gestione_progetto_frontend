import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { ThemeService } from '../core/theme/theme.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink],
  template: `
    <header class="bar">
      <a routerLink="/products" class="brand">
        <span class="mark">🚀</span>
        <span class="name">Lifecycle</span>
      </a>

      <div class="bar-right">
      <button type="button" class="theme-toggle" (click)="theme.toggle()"
              [attr.aria-label]="theme.theme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
              [title]="theme.theme() === 'dark' ? 'Light mode' : 'Dark mode'">
        {{ theme.theme() === 'dark' ? '☀️' : '🌙' }}
      </button>

      <div class="user" (click)="menuOpen.set(!menuOpen())">
        @if (auth.photoURL(); as photo) {
          <img [src]="photo" alt="" class="avatar" referrerpolicy="no-referrer" />
        } @else {
          <span class="avatar fallback">{{ initial() }}</span>
        }
        <span class="uname">{{ auth.displayName() ?? auth.email() }}</span>
        <span class="chev">▾</span>

        @if (menuOpen()) {
          <div class="menu" (click)="$event.stopPropagation()">
            <div class="menu-head">
              <strong>{{ auth.displayName() }}</strong>
              <span class="faint">{{ auth.email() }}</span>
            </div>
            <hr class="divider" />
            <button type="button" class="menu-item" (click)="logout()">Sign out</button>
          </div>
        }
      </div>
      </div>
    </header>

    @if (menuOpen()) {
      <div class="scrim" (click)="menuOpen.set(false)"></div>
    }

    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .bar {
      position: sticky;
      top: 0;
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 24px;
      background: var(--bar-bg);
      backdrop-filter: blur(12px);
      border-bottom: 1.5px solid var(--border);
    }
    .brand { display: flex; align-items: center; gap: 9px; }
    .bar-right { display: flex; align-items: center; gap: 8px; }
    .theme-toggle {
      border: 1.5px solid var(--border-strong);
      background: var(--surface);
      width: 38px;
      height: 38px;
      border-radius: var(--r-pill);
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color 0.15s, transform 0.1s;
    }
    .theme-toggle:hover { border-color: var(--primary); }
    .theme-toggle:active { transform: scale(0.94); }
    .mark { font-size: 22px; }
    .name { font-size: 19px; font-weight: 900; color: var(--text); letter-spacing: -0.02em; }
    .user {
      position: relative;
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 5px 12px 5px 5px;
      border-radius: var(--r-pill);
      cursor: pointer;
      transition: background 0.15s;
    }
    .user:hover { background: var(--surface-2); }
    .avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--surface);
      box-shadow: var(--shadow-sm);
    }
    .avatar.fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--primary-soft);
      color: var(--primary-strong);
      font-weight: 900;
    }
    .uname { font-weight: 700; font-size: 14px; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .chev { color: var(--text-faint); font-size: 11px; }
    .menu {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 240px;
      background: var(--surface);
      border-radius: var(--r-lg);
      box-shadow: var(--shadow-lg);
      border: 1.5px solid var(--border);
      padding: 14px;
      z-index: 60;
      animation: drop 0.16s ease;
    }
    .menu-head { display: flex; flex-direction: column; gap: 2px; }
    .menu-head .faint { font-size: 12px; }
    .menu-item {
      width: 100%;
      text-align: left;
      border: 0;
      background: transparent;
      padding: 9px 10px;
      border-radius: var(--r-md);
      font-weight: 800;
      color: var(--c-danger);
      cursor: pointer;
    }
    .menu-item:hover { background: var(--c-danger-bg); }
    .scrim { position: fixed; inset: 0; z-index: 40; }
    @keyframes drop { from { opacity: 0; transform: translateY(-6px); } }
    @media (max-width: 560px) { .uname { display: none; } }
  `],
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  private router = inject(Router);
  readonly menuOpen = signal(false);

  initial(): string {
    const n = this.auth.displayName() ?? this.auth.email() ?? '?';
    return n.charAt(0).toUpperCase();
  }

  async logout(): Promise<void> {
    this.menuOpen.set(false);
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }
}
