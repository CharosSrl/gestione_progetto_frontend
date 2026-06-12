import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductsService } from '../../core/services/products.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  PaginationMeta,
  Product,
  ProductInput,
  ProductStatus,
  ProductWithCounts,
} from '../../core/models/models';
import { BadgeComponent } from '../../shared/badge.component';
import { ModalComponent } from '../../shared/modal.component';
import { SpinnerComponent } from '../../shared/spinner.component';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { PaginatorComponent } from '../../shared/paginator.component';

const STATUSES: ProductStatus[] = ['ideation', 'definition', 'development'];

@Component({
  selector: 'app-products',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    BadgeComponent,
    ModalComponent,
    SpinnerComponent,
    EmptyStateComponent,
    PaginatorComponent,
  ],
  template: `
    <div class="page">
      <div class="spread head">
        <div>
          <h1>Your products</h1>
          <p class="muted">Every product you're shaping, from first idea to active development.</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="openCreate()">＋ New product</button>
      </div>

      @if (loading()) {
        <app-spinner label="Loading products…" />
      } @else if (products().length === 0) {
        <div class="card">
          <app-empty-state emoji="🌱" title="No products yet"
            subtitle="Create your first product to start tracking features, sprints and KPIs.">
            <button type="button" class="btn btn-primary" (click)="openCreate()">＋ Create a product</button>
          </app-empty-state>
        </div>
      } @else {
        <div class="grid-cards">
          @for (p of products(); track p.id) {
            <div class="card card-hover prod" (click)="open(p)">
              <div class="spread top">
                <app-badge kind="product" [value]="p.status" />
                <button type="button" class="btn btn-icon edit" (click)="openEdit(p, $event)" aria-label="Edit">✎</button>
              </div>
              <h3 class="title">{{ p.name }}</h3>
              <p class="desc muted">{{ p.description || 'No description yet.' }}</p>
              <div class="stats">
                <span class="stat"><b>{{ p._count?.features ?? 0 }}</b> features</span>
                <span class="stat"><b>{{ p._count?.sprints ?? 0 }}</b> sprints</span>
                <span class="stat"><b>{{ p._count?.kpis ?? 0 }}</b> KPIs</span>
              </div>
            </div>
          }
        </div>
        <app-paginator [meta]="meta()" (pageChange)="goTo($event)" />
      }
    </div>

    @if (showForm()) {
      <app-modal [title]="editing() ? 'Edit product' : 'New product'" (close)="closeForm()">
        <form (ngSubmit)="save()">
          <div class="field">
            <label for="p-name">Name</label>
            <input id="p-name" name="name" [(ngModel)]="form.name" maxlength="200" required
                   placeholder="e.g. Mobile checkout revamp" autocomplete="off" />
          </div>
          <div class="field">
            <label for="p-desc">Description</label>
            <textarea id="p-desc" name="description" [(ngModel)]="form.description"
                      placeholder="What is this product about?"></textarea>
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
            <button type="button" class="btn btn-ghost" (click)="closeForm()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!form.name.trim() || saving()">
              {{ saving() ? 'Saving…' : (editing() ? 'Save changes' : 'Create product') }}
            </button>
          </div>
        </form>
      </app-modal>
    }
  `,
  styles: [`
    .head { margin-bottom: var(--s-5); flex-wrap: wrap; }
    .head h1 { font-size: 26px; margin-bottom: 4px; }
    .prod { display: flex; flex-direction: column; gap: 10px; min-height: 184px; }
    .top { align-items: flex-start; }
    .edit {
      background: var(--surface-2);
      color: var(--text-soft);
      opacity: 0;
      transition: opacity 0.15s, background 0.15s, color 0.15s;
    }
    .prod:hover .edit { opacity: 1; }
    .edit:hover { background: var(--primary-soft); color: var(--primary-strong); }
    .title { font-size: 18px; }
    .desc {
      flex: 1;
      font-size: 14px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .stats { display: flex; gap: 16px; padding-top: 8px; border-top: 1.5px solid var(--border); }
    .stat { font-size: 13px; color: var(--text-soft); }
    .stat b { color: var(--text); font-weight: 900; }
    .seg { display: flex; gap: 8px; }
    .seg-opt {
      flex: 1;
      padding: 10px;
      border-radius: var(--r-md);
      border: 1.5px solid var(--border-strong);
      background: var(--surface);
      font-weight: 800;
      font-size: 13px;
      color: var(--text-soft);
      cursor: pointer;
      transition: all 0.15s;
    }
    .seg-opt.on { background: var(--primary-soft); border-color: var(--primary); color: var(--primary-strong); }
    .actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
  `],
})
export class ProductsComponent {
  private api = inject(ProductsService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  readonly statuses = STATUSES;
  readonly products = signal<ProductWithCounts[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly page = signal(1);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly editing = signal<ProductWithCounts | null>(null);
  readonly saving = signal(false);

  form: { name: string; description: string; status: ProductStatus } = {
    name: '',
    description: '',
    status: 'ideation',
  };

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.list(this.page()).subscribe({
      next: (res) => {
        this.products.set(res.data);
        this.meta.set(res.meta);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goTo(page: number): void {
    this.page.set(page);
    this.load();
  }

  label(s: ProductStatus): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  open(p: Product): void {
    this.router.navigate(['/products', p.id]);
  }

  openCreate(): void {
    this.editing.set(null);
    this.form = { name: '', description: '', status: 'ideation' };
    this.showForm.set(true);
  }

  openEdit(p: ProductWithCounts, ev: Event): void {
    ev.stopPropagation();
    this.editing.set(p);
    this.form = { name: p.name, description: p.description ?? '', status: p.status };
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  save(): void {
    if (!this.form.name.trim() || this.saving()) return;
    const payload: ProductInput = {
      name: this.form.name.trim(),
      description: this.form.description.trim() || null,
      status: this.form.status,
    };
    this.saving.set(true);
    const editing = this.editing();
    const req = editing ? this.api.update(editing.id, payload) : this.api.create(payload);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.notify.success(editing ? 'Product updated.' : 'Product created.');
        if (!editing) this.page.set(1);
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }
}
