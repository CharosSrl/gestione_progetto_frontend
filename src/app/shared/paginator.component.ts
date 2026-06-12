import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { PaginationMeta } from '../core/models/models';

/**
 * Prev/next pager driven by a `{ total, page, pageSize, totalPages }` meta.
 * Renders nothing when there's only one page (or no meta).
 */
@Component({
  selector: 'app-paginator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (meta(); as m) {
      @if (m.totalPages > 1) {
        <nav class="pager">
          <button type="button" class="btn btn-ghost btn-sm" [disabled]="m.page <= 1"
                  (click)="pageChange.emit(m.page - 1)">‹ Prev</button>
          <span class="info">
            Page <strong>{{ m.page }}</strong> of {{ m.totalPages }}
            <span class="faint">· {{ m.total }} total</span>
          </span>
          <button type="button" class="btn btn-ghost btn-sm" [disabled]="m.page >= m.totalPages"
                  (click)="pageChange.emit(m.page + 1)">Next ›</button>
        </nav>
      }
    }
  `,
  styles: [`
    .pager {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-top: var(--s-5);
    }
    .info { font-size: 14px; font-weight: 700; color: var(--text-soft); }
    .info strong { color: var(--text); }
  `],
})
export class PaginatorComponent {
  readonly meta = input<PaginationMeta | null>(null);
  readonly pageChange = output<number>();

  // Exposed for potential template use/testing.
  readonly hasPages = computed(() => (this.meta()?.totalPages ?? 0) > 1);
}
