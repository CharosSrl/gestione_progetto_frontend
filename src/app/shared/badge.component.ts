import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { StatusKind, statusMeta } from './status-meta';

@Component({
  selector: 'app-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="pill" [style.color]="'var(' + meta().fg + ')'" [style.background]="'var(' + meta().bg + ')'">
      <span class="dot"></span>{{ meta().label }}
    </span>
  `,
})
export class BadgeComponent {
  readonly kind = input.required<StatusKind>();
  readonly value = input<string | null>();

  readonly meta = computed(() => statusMeta(this.kind(), this.value()));
}
