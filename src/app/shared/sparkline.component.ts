import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Lightweight inline-SVG sparkline. Renders a smooth area + line for a series of
 * numeric values, plus an optional dashed target line. No external chart lib.
 */
@Component({
  selector: 'app-sparkline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (points().length >= 2) {
      <svg [attr.viewBox]="'0 0 ' + w() + ' ' + h()" preserveAspectRatio="none" class="spark" [style.height.px]="h()">
        <defs>
          <linearGradient [attr.id]="gradId()" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" [attr.stop-color]="color()" stop-opacity="0.28" />
            <stop offset="100%" [attr.stop-color]="color()" stop-opacity="0" />
          </linearGradient>
        </defs>
        @if (targetY() !== null) {
          <line [attr.x1]="0" [attr.x2]="w()" [attr.y1]="targetY()" [attr.y2]="targetY()"
                [attr.stroke]="'var(--accent)'" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.8" />
        }
        <path [attr.d]="areaPath()" [attr.fill]="'url(#' + gradId() + ')'" />
        <path [attr.d]="linePath()" fill="none" [attr.stroke]="color()" stroke-width="2.5"
              stroke-linecap="round" stroke-linejoin="round" />
        <circle [attr.cx]="lastX()" [attr.cy]="lastY()" r="3.5" [attr.fill]="color()" />
      </svg>
    } @else {
      <div class="flat muted">Not enough data yet</div>
    }
  `,
  styles: [`
    .spark { width: 100%; display: block; }
    .flat {
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      background: var(--surface-2);
      border-radius: var(--r-md);
    }
  `],
})
export class SparklineComponent {
  readonly values = input.required<number[]>();
  readonly target = input<number | null>(null);
  readonly color = input('var(--primary)');
  readonly height = input(48);

  private static seq = 0;
  private readonly uid = SparklineComponent.seq++;

  readonly w = computed(() => 240);
  readonly h = computed(() => this.height());
  readonly gradId = computed(() => `spark-grad-${this.uid}`);

  readonly points = computed(() => {
    const vals = this.values();
    if (vals.length < 2) return [];
    const pad = 5;
    const allVals = this.target() !== null ? [...vals, this.target() as number] : vals;
    const min = Math.min(...allVals);
    const max = Math.max(...allVals);
    const span = max - min || 1;
    const w = this.w();
    const h = this.h();
    const innerH = h - pad * 2;
    return vals.map((v, i) => {
      const x = (i / (vals.length - 1)) * w;
      const y = pad + innerH - ((v - min) / span) * innerH;
      return { x, y };
    });
  });

  readonly targetY = computed(() => {
    const t = this.target();
    if (t === null) return null;
    const vals = this.values();
    if (vals.length < 2) return null;
    const pad = 5;
    const allVals = [...vals, t];
    const min = Math.min(...allVals);
    const max = Math.max(...allVals);
    const span = max - min || 1;
    const innerH = this.h() - pad * 2;
    return pad + innerH - ((t - min) / span) * innerH;
  });

  readonly linePath = computed(() =>
    this.points()
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' '),
  );

  readonly areaPath = computed(() => {
    const pts = this.points();
    if (pts.length < 2) return '';
    const line = pts.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    return `M ${pts[0].x.toFixed(1)} ${this.h()} ${line} L ${pts[pts.length - 1].x.toFixed(1)} ${this.h()} Z`;
  });

  readonly lastX = computed(() => this.points().at(-1)?.x ?? 0);
  readonly lastY = computed(() => this.points().at(-1)?.y ?? 0);
}
