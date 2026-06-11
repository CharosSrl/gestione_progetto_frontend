import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KpisService } from '../../../core/services/kpis.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Kpi, KpiInput, KpiWithValues } from '../../../core/models/models';
import { ModalComponent } from '../../../shared/modal.component';
import { SpinnerComponent } from '../../../shared/spinner.component';
import { EmptyStateComponent } from '../../../shared/empty-state.component';
import { SparklineComponent } from '../../../shared/sparkline.component';

@Component({
  selector: 'app-kpis',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DecimalPipe,
    ModalComponent,
    SpinnerComponent,
    EmptyStateComponent,
    SparklineComponent,
  ],
  template: `
    <div class="spread bar">
      <p class="muted">Track the metrics that tell you whether this product is working.</p>
      <button type="button" class="btn btn-primary btn-sm" (click)="openCreate()">＋ New KPI</button>
    </div>

    @if (loading()) {
      <app-spinner label="Loading KPIs…" />
    } @else if (kpis().length === 0) {
      <div class="card">
        <app-empty-state emoji="📈" title="No KPIs yet"
          subtitle="Add a metric and start logging data points to see trends.">
          <button type="button" class="btn btn-primary" (click)="openCreate()">＋ Add a KPI</button>
        </app-empty-state>
      </div>
    } @else {
      <div class="grid-cards">
        @for (k of kpis(); track k.id) {
          <div class="card kpi">
            <div class="spread top">
              <div class="k-id">
                <strong class="k-name">{{ k.name }}</strong>
                @if (k.description) { <p class="faint k-desc">{{ k.description }}</p> }
              </div>
              <button type="button" class="btn btn-icon ghost" (click)="openEdit(k)" aria-label="Edit">✎</button>
            </div>

            <div class="figures">
              <div class="big">
                {{ latest(k) === null ? '—' : (latest(k) | number: '1.0-2') }}
                <span class="unit">{{ k.unit }}</span>
              </div>
              @if (k.targetValue != null) {
                <div class="target">
                  <span class="faint">target</span>
                  <strong>{{ k.targetValue | number: '1.0-2' }}</strong>
                </div>
              }
            </div>

            @if (k.targetValue != null && latest(k) !== null) {
              <div class="progress">
                <div class="fill" [style.width.%]="progress(k)"></div>
              </div>
            }

            <app-sparkline [values]="series(k)" [target]="k.targetValue ?? null" [height]="52" />

            <button type="button" class="btn btn-subtle btn-sm log" (click)="openLog(k)">＋ Log value</button>
          </div>
        }
      </div>
    }

    <!-- KPI create/edit -->
    @if (showForm()) {
      <app-modal [title]="editing() ? 'Edit KPI' : 'New KPI'" (close)="showForm.set(false)">
        <form (ngSubmit)="save()">
          <div class="field">
            <label for="k-name">Name</label>
            <input id="k-name" name="name" [(ngModel)]="form.name" maxlength="200" required
                   placeholder="e.g. Weekly active users" autocomplete="off" />
          </div>
          <div class="field">
            <label for="k-desc">Description</label>
            <textarea id="k-desc" name="description" [(ngModel)]="form.description"></textarea>
          </div>
          <div class="form-row">
            <div class="field">
              <label for="k-unit">Unit</label>
              <input id="k-unit" name="unit" [(ngModel)]="form.unit" required placeholder="users, %, €…" autocomplete="off" />
            </div>
            <div class="field">
              <label for="k-target">Target value</label>
              <input id="k-target" name="target" type="number" step="any" [(ngModel)]="form.targetValue" />
            </div>
          </div>
          <div class="field">
            <label for="k-current">Current value (optional)</label>
            <input id="k-current" name="current" type="number" step="any" [(ngModel)]="form.currentValue" />
          </div>
          <div class="actions">
            <button type="button" class="btn btn-ghost" (click)="showForm.set(false)">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!form.name.trim() || !form.unit.trim() || saving()">
              {{ saving() ? 'Saving…' : (editing() ? 'Save changes' : 'Create KPI') }}
            </button>
          </div>
        </form>
      </app-modal>
    }

    <!-- Log value -->
    @if (logging(); as k) {
      <app-modal [title]="'Log value · ' + k.name" (close)="logging.set(null)">
        <form (ngSubmit)="saveLog()">
          <div class="form-row">
            <div class="field">
              <label for="v-value">Value ({{ k.unit }})</label>
              <input id="v-value" name="value" type="number" step="any" [(ngModel)]="logValue" required autocomplete="off" />
            </div>
            <div class="field">
              <label for="v-date">Recorded at</label>
              <input id="v-date" name="recordedAt" type="date" [(ngModel)]="logDate" />
            </div>
          </div>
          <div class="actions">
            <button type="button" class="btn btn-ghost" (click)="logging.set(null)">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="logValue === null || saving()">
              {{ saving() ? 'Saving…' : 'Log value' }}
            </button>
          </div>
        </form>
      </app-modal>
    }
  `,
  styles: [`
    .bar { margin-bottom: 18px; flex-wrap: wrap; gap: 10px; }
    .kpi { display: flex; flex-direction: column; gap: 12px; }
    .top { align-items: flex-start; }
    .k-id { min-width: 0; }
    .k-name { font-size: 16px; }
    .k-desc { margin: 2px 0 0; font-size: 12.5px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .ghost { background: var(--surface-2); color: var(--text-soft); }
    .ghost:hover { background: var(--primary-soft); color: var(--primary-strong); }
    .figures { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
    .big { font-size: 30px; font-weight: 900; letter-spacing: -0.03em; color: var(--text); }
    .unit { font-size: 14px; font-weight: 800; color: var(--text-faint); margin-left: 5px; }
    .target { text-align: right; font-size: 13px; }
    .target .faint { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
    .target strong { color: var(--accent); font-size: 16px; }
    .progress { height: 8px; background: var(--surface-2); border-radius: var(--r-pill); overflow: hidden; }
    .fill { height: 100%; background: linear-gradient(90deg, var(--primary), var(--accent)); border-radius: var(--r-pill); transition: width 0.4s ease; }
    .log { align-self: flex-start; }
    .actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
  `],
})
export class KpisComponent implements OnInit {
  private api = inject(KpisService);
  private notify = inject(NotificationService);

  readonly id = input.required<string>();

  readonly kpis = signal<KpiWithValues[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly editing = signal<Kpi | null>(null);
  readonly logging = signal<KpiWithValues | null>(null);
  readonly saving = signal(false);

  form: { name: string; description: string; unit: string; targetValue: number | null; currentValue: number | null } = {
    name: '',
    description: '',
    unit: '',
    targetValue: null,
    currentValue: null,
  };

  logValue: number | null = null;
  logDate = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.list(this.id()).subscribe({
      next: (list) => {
        this.kpis.set(list.map((k) => ({ ...k, values: sortByDate(k.values ?? []) })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  series(k: KpiWithValues): number[] {
    return (k.values ?? []).map((v) => v.value);
  }

  latest(k: KpiWithValues): number | null {
    const vals = k.values ?? [];
    if (vals.length) return vals[vals.length - 1].value;
    return k.currentValue ?? null;
  }

  progress(k: KpiWithValues): number {
    const latest = this.latest(k);
    if (latest === null || k.targetValue == null || k.targetValue === 0) return 0;
    return Math.max(0, Math.min(100, (latest / k.targetValue) * 100));
  }

  openCreate(): void {
    this.editing.set(null);
    this.form = { name: '', description: '', unit: '', targetValue: null, currentValue: null };
    this.showForm.set(true);
  }

  openEdit(k: Kpi): void {
    this.editing.set(k);
    this.form = {
      name: k.name,
      description: k.description ?? '',
      unit: k.unit,
      targetValue: k.targetValue ?? null,
      currentValue: k.currentValue ?? null,
    };
    this.showForm.set(true);
  }

  save(): void {
    if (!this.form.name.trim() || !this.form.unit.trim() || this.saving()) return;
    const payload: KpiInput = {
      name: this.form.name.trim(),
      description: this.form.description.trim() || null,
      unit: this.form.unit.trim(),
      targetValue: numOrNull(this.form.targetValue),
      currentValue: numOrNull(this.form.currentValue),
    };
    this.saving.set(true);
    const editing = this.editing();
    const req = editing ? this.api.update(this.id(), editing.id, payload) : this.api.create(this.id(), payload);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.notify.success(editing ? 'KPI updated.' : 'KPI created.');
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  openLog(k: KpiWithValues): void {
    this.logging.set(k);
    this.logValue = null;
    this.logDate = new Date().toISOString().slice(0, 10);
  }

  saveLog(): void {
    const k = this.logging();
    if (!k || this.logValue === null || this.saving()) return;
    this.saving.set(true);
    this.api
      .logValue(this.id(), k.id, {
        value: Number(this.logValue),
        recordedAt: this.logDate ? new Date(this.logDate + 'T00:00:00').toISOString() : undefined,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.logging.set(null);
          this.notify.success('Value logged.');
          this.load();
        },
        error: () => this.saving.set(false),
      });
  }
}

function numOrNull(v: number | null): number | null {
  return v === null || v === undefined || Number.isNaN(v) ? null : Number(v);
}

function sortByDate<T extends { recordedAt: string }>(values: T[]): T[] {
  return [...values].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
}
