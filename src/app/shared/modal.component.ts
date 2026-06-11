import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="backdrop" (click)="onBackdrop()">
      <div class="sheet" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
        <header class="sheet-head">
          <h3>{{ title() }}</h3>
          <button type="button" class="x" (click)="close.emit()" aria-label="Close">✕</button>
        </header>
        <div class="sheet-body">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(43, 37, 64, 0.42);
      backdrop-filter: blur(3px);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 6vh 16px;
      z-index: 100;
      animation: fade 0.15s ease;
      overflow-y: auto;
    }
    .sheet {
      width: 100%;
      max-width: 540px;
      background: var(--surface);
      border-radius: var(--r-xl);
      box-shadow: var(--shadow-lg);
      animation: pop 0.18s cubic-bezier(0.2, 0.9, 0.3, 1.3);
      overflow: hidden;
    }
    .sheet-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px 12px;
    }
    .sheet-head h3 { font-size: 19px; }
    .x {
      border: 0;
      background: var(--surface-2);
      color: var(--text-soft);
      width: 32px;
      height: 32px;
      border-radius: var(--r-pill);
      cursor: pointer;
      font-size: 13px;
      transition: background 0.15s, color 0.15s;
    }
    .x:hover { background: var(--c-danger-bg); color: var(--c-danger); }
    .sheet-body { padding: 4px 24px 24px; }
    @keyframes fade { from { opacity: 0; } }
    @keyframes pop { from { opacity: 0; transform: translateY(8px) scale(0.97); } }
  `],
})
export class ModalComponent {
  readonly title = input('');
  readonly closeOnBackdrop = input(true);
  readonly close = output<void>();

  onBackdrop(): void {
    if (this.closeOnBackdrop()) {
      this.close.emit();
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.close.emit();
  }
}
