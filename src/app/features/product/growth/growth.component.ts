import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { GrowthCanvasComponent } from './growth-canvas.component';
import { GrowthExperimentsComponent } from './growth-experiments.component';

type GrowthView = 'canvas' | 'experiments';

@Component({
  selector: 'app-growth',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GrowthCanvasComponent, GrowthExperimentsComponent],
  template: `
    <div class="switch">
      <div class="tabs">
        <a [class.active]="view() === 'canvas'" (click)="view.set('canvas')">🧭 Canvas</a>
        <a [class.active]="view() === 'experiments'" (click)="view.set('experiments')">⚗️ Experiments</a>
      </div>
    </div>

    @if (view() === 'canvas') {
      <app-growth-canvas [id]="id()" />
    } @else {
      <app-growth-experiments [id]="id()" />
    }
  `,
  styles: [`
    .switch { margin-bottom: 20px; }
    .tabs a { cursor: pointer; }
  `],
})
export class GrowthComponent {
  readonly id = input.required<string>();
  readonly view = signal<GrowthView>('canvas');
}
