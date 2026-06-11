import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationService } from '../core/services/notification.service';

@Component({
  selector: 'app-toasts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stack" aria-live="polite">
      @for (t of notify.toasts(); track t.id) {
        <div class="toast" [class]="t.kind" (click)="notify.dismiss(t.id)">
          <span class="ico">{{ icon(t.kind) }}</span>
          <span class="msg">{{ t.message }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .stack {
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 200;
      max-width: min(380px, calc(100vw - 32px));
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 13px 16px;
      border-radius: var(--r-md);
      background: var(--surface);
      box-shadow: var(--shadow-lg);
      border-left: 4px solid var(--c-muted);
      cursor: pointer;
      font-weight: 700;
      font-size: 14px;
      animation: slide 0.2s ease;
    }
    .toast.success { border-left-color: var(--c-success); }
    .toast.error { border-left-color: var(--c-danger); }
    .toast.info { border-left-color: var(--primary); }
    .ico { font-size: 16px; }
    @keyframes slide { from { opacity: 0; transform: translateX(16px); } }
  `],
})
export class ToastComponent {
  readonly notify = inject(NotificationService);

  icon(kind: string): string {
    return kind === 'success' ? '✅' : kind === 'error' ? '⚠️' : 'ℹ️';
  }
}
