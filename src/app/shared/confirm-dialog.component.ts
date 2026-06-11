import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ConfirmService } from './confirm.service';
import { ModalComponent } from './modal.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalComponent],
  template: `
    @if (confirm.active(); as c) {
      <app-modal [title]="c.title" (close)="confirm.resolve(false)">
        <p class="muted msg">{{ c.message }}</p>
        <div class="actions">
          <button type="button" class="btn btn-ghost" (click)="confirm.resolve(false)">Cancel</button>
          <button type="button" class="btn" [class.btn-danger]="c.danger" [class.btn-primary]="!c.danger"
                  (click)="confirm.resolve(true)">
            {{ c.confirmLabel ?? 'Confirm' }}
          </button>
        </div>
      </app-modal>
    }
  `,
  styles: [`
    .msg { margin: 4px 0 20px; }
    .actions { display: flex; justify-content: flex-end; gap: 10px; }
  `],
})
export class ConfirmDialogComponent {
  readonly confirm = inject(ConfirmService);
}
