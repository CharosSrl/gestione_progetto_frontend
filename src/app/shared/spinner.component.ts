import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap" [class.inline]="inline()">
      <span class="ring"></span>
      @if (label()) { <span class="muted">{{ label() }}</span> }
    </div>
  `,
  styles: [`
    .wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: var(--s-7) 0;
    }
    .wrap.inline { flex-direction: row; padding: 0; gap: 8px; }
    .ring {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 3px solid var(--primary-soft);
      border-top-color: var(--primary);
      animation: spin 0.7s linear infinite;
    }
    .inline .ring { width: 16px; height: 16px; border-width: 2px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class SpinnerComponent {
  readonly label = input<string | null>(null);
  readonly inline = input(false);
}
