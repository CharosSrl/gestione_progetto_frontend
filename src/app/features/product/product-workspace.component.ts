import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../core/services/products.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmService } from '../../shared/confirm.service';
import { ProductInput, ProductStatus, ProductWithCounts } from '../../core/models/models';
import { BadgeComponent } from '../../shared/badge.component';
import { ModalComponent } from '../../shared/modal.component';
import { SpinnerComponent } from '../../shared/spinner.component';

const STATUSES: ProductStatus[] = ['ideation', 'definition', 'development'];

@Component({
  selector: 'app-product-workspace',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    FormsModule,
    BadgeComponent,
    ModalComponent,
    SpinnerComponent,
  ],
  template: `
    <div class="page">
      <a routerLink="/products" class="back muted">← All products</a>

      @if (loading()) {
        <app-spinner label="Loading…" />
      } @else if (product(); as p) {
        <div class="spread head">
          <div class="row title-row">
            <h1>{{ p.name }}</h1>
            <app-badge kind="product" [value]="p.status" />
          </div>
          <div class="row">
            <button type="button" class="btn btn-ghost btn-sm" (click)="openEdit()">✎ Edit</button>
            <button type="button" class="btn btn-danger btn-sm" (click)="remove()">Delete</button>
          </div>
        </div>
        @if (p.description) {
          <p class="muted desc">{{ p.description }}</p>
        }

        <nav class="tabs nav">
          <a routerLink="features" routerLinkActive="active">🧩 Features</a>
          <a routerLink="sprints" routerLinkActive="active">🏃 Sprints</a>
          <a routerLink="kpis" routerLinkActive="active">📈 KPIs</a>
          <a routerLink="growth" routerLinkActive="active">🌱 Growth</a>
        </nav>

        <router-outlet></router-outlet>
      } @else {
        <div class="card">
          <p>Product not found.</p>
        </div>
      }
    </div>

    @if (showEdit() && product(); as p) {
      <app-modal title="Edit product" (close)="showEdit.set(false)">
        <form (ngSubmit)="save()">
          <div class="field">
            <label for="w-name">Name</label>
            <input id="w-name" name="name" [(ngModel)]="form.name" maxlength="200" required />
          </div>
          <div class="field">
            <label for="w-desc">Description</label>
            <textarea id="w-desc" name="description" [(ngModel)]="form.description"></textarea>
          </div>
          <div class="field">
            <label>Phase</label>
            <div class="seg">
              @for (s of statuses; track s) {
                <button type="button" class="seg-opt" [class.on]="form.status === s" (click)="form.status = s">
                  {{ label(s) }}
                </button>
              }
            </div>
          </div>
          <div class="actions">
            <button type="button" class="btn btn-ghost" (click)="showEdit.set(false)">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!form.name.trim() || saving()">
              {{ saving() ? 'Saving…' : 'Save changes' }}
            </button>
          </div>
        </form>
      </app-modal>
    }
  `,
  styles: [`
    .back { display: inline-block; font-weight: 800; font-size: 14px; margin-bottom: 14px; }
    .back:hover { color: var(--primary-strong); }
    .head { flex-wrap: wrap; gap: 12px; }
    .title-row { gap: 12px; flex-wrap: wrap; }
    .head h1 { font-size: 26px; }
    .desc { margin: 6px 0 0; max-width: 70ch; }
    .nav { margin: 22px 0 24px; }
    .seg { display: flex; gap: 8px; }
    .seg-opt {
      flex: 1; padding: 10px; border-radius: var(--r-md);
      border: 1.5px solid var(--border-strong); background: var(--surface);
      font-weight: 800; font-size: 13px; color: var(--text-soft); cursor: pointer; transition: all 0.15s;
    }
    .seg-opt.on { background: var(--primary-soft); border-color: var(--primary); color: var(--primary-strong); }
    .actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
  `],
})
export class ProductWorkspaceComponent implements OnInit {
  private api = inject(ProductsService);
  private notify = inject(NotificationService);
  private confirm = inject(ConfirmService);
  private router = inject(Router);

  /** Bound from the `:id` route param via withComponentInputBinding(). */
  readonly id = input.required<string>();

  readonly statuses = STATUSES;
  readonly product = signal<ProductWithCounts | null>(null);
  readonly loading = signal(true);
  readonly showEdit = signal(false);
  readonly saving = signal(false);

  form: { name: string; description: string; status: ProductStatus } = {
    name: '',
    description: '',
    status: 'ideation',
  };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.get(this.id()).subscribe({
      next: (p) => {
        this.product.set(p);
        this.loading.set(false);
      },
      error: () => {
        this.product.set(null);
        this.loading.set(false);
      },
    });
  }

  label(s: ProductStatus): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  openEdit(): void {
    const p = this.product();
    if (!p) return;
    this.form = { name: p.name, description: p.description ?? '', status: p.status };
    this.showEdit.set(true);
  }

  save(): void {
    const p = this.product();
    if (!p || !this.form.name.trim() || this.saving()) return;
    const payload: ProductInput = {
      name: this.form.name.trim(),
      description: this.form.description.trim() || null,
      status: this.form.status,
    };
    this.saving.set(true);
    this.api.update(p.id, payload).subscribe({
      next: (updated) => {
        this.product.set({ ...p, ...updated });
        this.saving.set(false);
        this.showEdit.set(false);
        this.notify.success('Product updated.');
      },
      error: () => this.saving.set(false),
    });
  }

  async remove(): Promise<void> {
    const p = this.product();
    if (!p) return;
    const ok = await this.confirm.ask({
      title: 'Delete product?',
      message: `“${p.name}” and all its features, sprints, tasks and KPIs will be permanently removed.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.api.delete(p.id).subscribe({
      next: () => {
        this.notify.success('Product deleted.');
        this.router.navigate(['/products']);
      },
    });
  }
}
