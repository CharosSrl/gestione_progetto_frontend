import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeaturesService } from '../../../core/services/features.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmService } from '../../../shared/confirm.service';
import {
  Feature,
  FeatureInput,
  FeaturePhase,
  FeatureStatus,
  MoscowCategory,
  PaginationMeta,
  PriorityMethod,
  riceScore,
} from '../../../core/models/models';
import { BadgeComponent } from '../../../shared/badge.component';
import { ModalComponent } from '../../../shared/modal.component';
import { SpinnerComponent } from '../../../shared/spinner.component';
import { EmptyStateComponent } from '../../../shared/empty-state.component';
import { PaginatorComponent } from '../../../shared/paginator.component';

const STATUSES: FeatureStatus[] = ['idea', 'backlog', 'in_progress', 'done', 'rejected'];
const PHASES: FeaturePhase[] = ['ideation', 'definition', 'development'];
const MOSCOW: MoscowCategory[] = ['must', 'should', 'could', 'wont'];

interface FeatureForm {
  title: string;
  description: string;
  phase: FeaturePhase;
  status: FeatureStatus;
  priorityMethod: PriorityMethod;
  riceReach: number | null;
  riceImpact: number | null;
  riceConfidence: number | null;
  riceEffort: number | null;
  moscowCategory: MoscowCategory;
}

@Component({
  selector: 'app-features',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DecimalPipe,
    BadgeComponent,
    ModalComponent,
    SpinnerComponent,
    EmptyStateComponent,
    PaginatorComponent,
  ],
  template: `
    <div class="spread bar">
      <p class="muted">Prioritise your backlog with RICE scoring or MoSCoW categories.</p>
      <button type="button" class="btn btn-primary btn-sm" (click)="openCreate()">＋ Add feature</button>
    </div>

    @if (loading()) {
      <app-spinner label="Loading features…" />
    } @else if (features().length === 0) {
      <div class="card">
        <app-empty-state emoji="🧩" title="No features yet"
          subtitle="Capture ideas and prioritise what to build next.">
          <button type="button" class="btn btn-primary" (click)="openCreate()">＋ Add your first feature</button>
        </app-empty-state>
      </div>
    } @else {
      @for (group of grouped(); track group.status) {
        @if (group.items.length) {
          <section class="group">
            <div class="row g-head">
              <app-badge kind="feature" [value]="group.status" />
              <span class="faint count">{{ group.items.length }}</span>
            </div>
            <div class="list">
              @for (f of group.items; track f.id) {
                <div class="card row item">
                  <div class="main">
                    <div class="row t-row">
                      <strong class="ttl">{{ f.title }}</strong>
                      @if (f.priorityMethod === 'moscow' && f.moscowCategory) {
                        <app-badge kind="moscow" [value]="f.moscowCategory" />
                      } @else if (score(f) !== null) {
                        <span class="pill rice">RICE {{ score(f) | number: '1.0-1' }}</span>
                      }
                    </div>
                    @if (f.description) { <p class="muted dsc">{{ f.description }}</p> }
                  </div>
                  <div class="row tools">
                    <button type="button" class="btn btn-icon ghost" (click)="openEdit(f)" aria-label="Edit">✎</button>
                    <button type="button" class="btn btn-icon ghost" (click)="remove(f)" aria-label="Delete">🗑</button>
                  </div>
                </div>
              }
            </div>
          </section>
        }
      }
      <app-paginator [meta]="meta()" (pageChange)="goTo($event)" />
    }

    @if (showForm()) {
      <app-modal [title]="editing() ? 'Edit feature' : 'New feature'" (close)="showForm.set(false)">
        <form (ngSubmit)="save()">
          <div class="field">
            <label for="f-title">Title</label>
            <input id="f-title" name="title" [(ngModel)]="form.title" maxlength="200" required
                   placeholder="e.g. One-tap reorder" autocomplete="off" />
          </div>
          <div class="field">
            <label for="f-desc">Description</label>
            <textarea id="f-desc" name="description" [(ngModel)]="form.description"></textarea>
          </div>
          <div class="form-row">
            <div class="field">
              <label for="f-phase">Phase</label>
              <select id="f-phase" name="phase" [(ngModel)]="form.phase">
                @for (p of phases; track p) { <option [value]="p">{{ cap(p) }}</option> }
              </select>
            </div>
            <div class="field">
              <label for="f-status">Status</label>
              <select id="f-status" name="status" [(ngModel)]="form.status">
                @for (s of statuses; track s) { <option [value]="s">{{ statusLabel(s) }}</option> }
              </select>
            </div>
          </div>

          <div class="field">
            <label>Prioritisation</label>
            <div class="seg">
              <button type="button" class="seg-opt" [class.on]="form.priorityMethod === 'rice'"
                      (click)="form.priorityMethod = 'rice'">RICE</button>
              <button type="button" class="seg-opt" [class.on]="form.priorityMethod === 'moscow'"
                      (click)="form.priorityMethod = 'moscow'">MoSCoW</button>
            </div>
          </div>

          @if (form.priorityMethod === 'rice') {
            <div class="form-row">
              <div class="field">
                <label for="r-reach">Reach</label>
                <input id="r-reach" name="reach" type="number" min="0" [(ngModel)]="form.riceReach" placeholder="e.g. 500" />
              </div>
              <div class="field">
                <label for="r-impact">Impact</label>
                <input id="r-impact" name="impact" type="number" min="0" step="0.25" [(ngModel)]="form.riceImpact" placeholder="0.25–3" />
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label for="r-conf">Confidence (0–1)</label>
                <input id="r-conf" name="conf" type="number" min="0" max="1" step="0.05" [(ngModel)]="form.riceConfidence" placeholder="0.8" />
              </div>
              <div class="field">
                <label for="r-effort">Effort</label>
                <input id="r-effort" name="effort" type="number" min="0" step="0.5" [(ngModel)]="form.riceEffort" placeholder="person-months" />
              </div>
            </div>
            <div class="rice-out">
              RICE score:
              <strong>{{ liveScore() === null ? '—' : (liveScore() | number: '1.0-2') }}</strong>
            </div>
          } @else {
            <div class="field">
              <label>MoSCoW category</label>
              <div class="seg">
                @for (m of moscow; track m) {
                  <button type="button" class="seg-opt" [class.on]="form.moscowCategory === m"
                          (click)="form.moscowCategory = m">{{ moscowLabel(m) }}</button>
                }
              </div>
            </div>
          }

          <div class="actions">
            <button type="button" class="btn btn-ghost" (click)="showForm.set(false)">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!form.title.trim() || saving()">
              {{ saving() ? 'Saving…' : (editing() ? 'Save changes' : 'Add feature') }}
            </button>
          </div>
        </form>
      </app-modal>
    }
  `,
  styles: [`
    .bar { margin-bottom: 18px; flex-wrap: wrap; gap: 10px; }
    .group { margin-bottom: 22px; }
    .g-head { margin-bottom: 10px; gap: 8px; }
    .count { font-weight: 800; font-size: 13px; }
    .list { display: flex; flex-direction: column; gap: 10px; }
    .item { justify-content: space-between; padding: 14px 16px; gap: 12px; }
    .main { min-width: 0; }
    .t-row { gap: 10px; flex-wrap: wrap; }
    .ttl { font-size: 15px; }
    .rice { background: var(--primary-soft); color: var(--primary-strong); }
    .dsc { margin: 4px 0 0; font-size: 13px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .tools { flex-shrink: 0; }
    .ghost { background: var(--surface-2); color: var(--text-soft); }
    .ghost:hover { background: var(--primary-soft); color: var(--primary-strong); }
    .seg { display: flex; gap: 8px; flex-wrap: wrap; }
    .seg-opt {
      flex: 1; min-width: 64px; padding: 9px; border-radius: var(--r-md);
      border: 1.5px solid var(--border-strong); background: var(--surface);
      font-weight: 800; font-size: 13px; color: var(--text-soft); cursor: pointer; transition: all 0.15s;
    }
    .seg-opt.on { background: var(--primary-soft); border-color: var(--primary); color: var(--primary-strong); }
    .rice-out {
      background: var(--surface-2); border-radius: var(--r-md); padding: 11px 14px;
      font-size: 14px; font-weight: 700; color: var(--text-soft); margin-bottom: 8px;
    }
    .rice-out strong { color: var(--primary-strong); font-size: 16px; margin-left: 6px; }
    .actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
  `],
})
export class FeaturesComponent implements OnInit {
  private api = inject(FeaturesService);
  private notify = inject(NotificationService);
  private confirm = inject(ConfirmService);

  readonly id = input.required<string>();

  readonly statuses = STATUSES;
  readonly phases = PHASES;
  readonly moscow = MOSCOW;

  readonly features = signal<Feature[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly page = signal(1);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly editing = signal<Feature | null>(null);
  readonly saving = signal(false);

  form: FeatureForm = this.blank();

  readonly grouped = computed(() =>
    STATUSES.map((status) => ({
      status,
      items: this.features().filter((f) => (f.status ?? 'idea') === status),
    })),
  );

  readonly liveScore = computed(() => riceScore(this.form));

  ngOnInit(): void {
    this.load();
  }

  private blank(): FeatureForm {
    return {
      title: '',
      description: '',
      phase: 'ideation',
      status: 'idea',
      priorityMethod: 'rice',
      riceReach: null,
      riceImpact: null,
      riceConfidence: null,
      riceEffort: null,
      moscowCategory: 'should',
    };
  }

  load(): void {
    this.loading.set(true);
    this.api.list(this.id(), this.page()).subscribe({
      next: (res) => {
        this.features.set(res.data);
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

  score(f: Feature): number | null {
    return riceScore(f);
  }

  cap(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  statusLabel(s: FeatureStatus): string {
    return s === 'in_progress' ? 'In progress' : this.cap(s);
  }
  moscowLabel(m: MoscowCategory): string {
    return m === 'wont' ? "Won't" : this.cap(m);
  }

  openCreate(): void {
    this.editing.set(null);
    this.form = this.blank();
    this.showForm.set(true);
  }

  openEdit(f: Feature): void {
    this.editing.set(f);
    this.form = {
      title: f.title,
      description: f.description ?? '',
      phase: f.phase ?? 'ideation',
      status: f.status ?? 'idea',
      priorityMethod: f.priorityMethod ?? 'rice',
      riceReach: f.riceReach ?? null,
      riceImpact: f.riceImpact ?? null,
      riceConfidence: f.riceConfidence ?? null,
      riceEffort: f.riceEffort ?? null,
      moscowCategory: f.moscowCategory ?? 'should',
    };
    this.showForm.set(true);
  }

  save(): void {
    if (!this.form.title.trim() || this.saving()) return;
    const f = this.form;
    const isRice = f.priorityMethod === 'rice';
    const payload: FeatureInput = {
      title: f.title.trim(),
      description: f.description.trim() || null,
      phase: f.phase,
      status: f.status,
      priorityMethod: f.priorityMethod,
      riceReach: isRice ? num(f.riceReach) : null,
      riceImpact: isRice ? num(f.riceImpact) : null,
      riceConfidence: isRice ? num(f.riceConfidence) : null,
      riceEffort: isRice ? num(f.riceEffort) : null,
      moscowCategory: isRice ? null : f.moscowCategory,
    };
    this.saving.set(true);
    const editing = this.editing();
    const req = editing
      ? this.api.update(this.id(), editing.id, payload)
      : this.api.create(this.id(), payload);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.notify.success(editing ? 'Feature updated.' : 'Feature added.');
        if (!editing) this.page.set(1);
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  async remove(f: Feature): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Delete feature?',
      message: `“${f.title}” will be removed.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.api.delete(this.id(), f.id).subscribe({
      next: () => {
        this.notify.success('Feature deleted.');
        this.load();
      },
    });
  }
}

function num(v: number | null): number | null {
  return v === null || v === undefined || Number.isNaN(v) ? null : Number(v);
}
