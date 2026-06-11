import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty">
      <div class="emoji">{{ emoji() }}</div>
      <h4>{{ title() }}</h4>
      @if (subtitle()) {
        <p class="muted">{{ subtitle() }}</p>
      }
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .empty {
      text-align: center;
      padding: var(--s-7) var(--s-4);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .emoji {
      font-size: 44px;
      margin-bottom: 4px;
      filter: saturate(1.1);
    }
    h4 { font-size: 18px; }
    p { margin: 0 0 8px; max-width: 36ch; }
  `],
})
export class EmptyStateComponent {
  readonly emoji = input('✨');
  readonly title = input('Nothing here yet');
  readonly subtitle = input<string | null>(null);
}
