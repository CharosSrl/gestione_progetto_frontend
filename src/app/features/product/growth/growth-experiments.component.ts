import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GrowthService } from '../../../core/services/growth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmService } from '../../../shared/confirm.service';
import {
  ExperimentOutcome,
  ExperimentStatus,
  GrowthExperiment,
  GrowthExperimentCreate,
  GrowthExperimentPatch,
  GrowthSection,
  riceScore,
} from '../../../core/models/models';
import { BadgeComponent } from '../../../shared/badge.component';
import { ModalComponent } from '../../../shared/modal.component';
import { SpinnerComponent } from '../../../shared/spinner.component';
import { EmptyStateComponent } from '../../../shared/empty-state.component';
import { GROWTH_SECTIONS } from './growth-fields';

const COLUMNS: { key: ExperimentStatus; label: string; emoji: string }[] = [
  { key: 'backlog', label: 'Backlog', emoji: '🗂' },
  { key: 'running', label: 'Running', emoji: '⚗️' },
  { key: 'done', label: 'Done', emoji: '✅' },
];
const OUTCOMES: ExperimentOutcome[] = ['validated', 'invalidated', 'inconclusive'];

interface ExpForm {
  title: string;
  hypothesis: string;
  section: GrowthSection;
  metric: string;
  riceReach: number | null;
  riceImpact: number | null;
  riceConfidence: number | null;
  riceEffort: number | null;
  status: ExperimentStatus;
  outcome: ExperimentOutcome | '';
  learning: string;
  startedAt: string;
  endedAt: string;
}

@Component({
  selector: 'app-growth-experiments',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DecimalPipe, BadgeComponent, ModalComponent, SpinnerComponent, EmptyStateComponent],
  template: `
    <div class="spread bar">
      <p class="muted">High-tempo testing — score ideas with RICE, run them, capture what you learned.</p>
      <button type="button" class="btn btn-primary btn-sm" (click)="openCreate()">＋ New experiment</button>
    </div>

    @if (loading()) {
      <app-spinner label="Loading experiments…" />
    } @else if (experiments().length === 0) {
      <div class="card">
        <app-empty-state emoji="⚗️" title="No experiments yet"
          subtitle="Add a hypothesis, score it with RICE, and start testing.">
          <button type="button" class="btn btn-primary" (click)="openCreate()">＋ Add your first experiment</button>
        </app-empty-state>
      </div>
    } @else {
      <div class="board">
        @for (col of columns; track col.key) {
          <div class="col">
            <div class="col-head"><span>{{ col.emoji }} {{ col.label }}</span><span class="faint">{{ forStatus(col.key).length }}</span></div>
            <div class="col-body">
              @for (e of forStatus(col.key); track e.id) {
                <div class="card exp">
                  <div class="spread">
                    <strong class="t">{{ e.title }}</strong>
                    @if (score(e) !== null) { <span class="pill rice">RICE {{ score(e) | number: '1.0-1' }}</span> }
                  </div>
                  @if (e.hypothesis) { <p class="muted hyp">{{ e.hypothesis }}</p> }
                  <div class="meta">
                    @if (e.metric) { <span class="chip">📊 {{ e.metric }}</span> }
                    @if (e.section) { <span class="chip">{{ sectionLabel(e.section) }}</span> }
                    @if (e.outcome) { <app-badge kind="outcome" [value]="e.outcome" /> }
                  </div>
                  @if (e.learning) { <p class="learn">💡 {{ e.learning }}</p> }
                  <div class="move">
                    @for (c of columns; track c.key) {
                      @if (c.key !== e.status) {
                        <button type="button" class="move-btn" (click)="move(e, c.key)">→ {{ c.label }}</button>
                      }
                    }
                    <button type="button" class="move-btn" (click)="openEdit(e)">Edit</button>
                    <button type="button" class="move-btn del" (click)="remove(e)">Delete</button>
                  </div>
                </div>
              }
              @if (forStatus(col.key).length === 0) { <p class="faint empty-col">Nothing here</p> }
            </div>
          </div>
        }
      </div>
    }

    @if (showForm()) {
      <app-modal [title]="editing() ? 'Edit experiment' : 'New experiment'" (close)="showForm.set(false)">
        <form (ngSubmit)="save()">
          <div class="field">
            <label for="e-title">Title</label>
            <input id="e-title" name="title" [(ngModel)]="form.title" maxlength="200" required
                   placeholder="e.g. Onboarding checklist boosts activation" autocomplete="off" />
          </div>
          <div class="field">
            <label for="e-hyp">Hypothesis</label>
            <textarea id="e-hyp" name="hyp" [(ngModel)]="form.hypothesis"
                      placeholder="We believe that… will result in… measured by…"></textarea>
          </div>
          <div class="form-row">
            <div class="field">
              <label for="e-section">Section</label>
              <select id="e-section" name="section" [(ngModel)]="form.section">
                @for (s of sections; track s.key) { <option [value]="s.key">{{ s.emoji }} {{ s.label }}</option> }
              </select>
            </div>
            <div class="field">
              <label for="e-metric">Metric</label>
              <input id="e-metric" name="metric" [(ngModel)]="form.metric" placeholder="activation_rate" autocomplete="off" />
            </div>
          </div>

          <div class="form-row">
            <div class="field">
              <label for="e-reach">Reach</label>
              <input id="e-reach" name="reach" type="number" min="0" [(ngModel)]="form.riceReach" />
            </div>
            <div class="field">
              <label for="e-impact">Impact</label>
              <input id="e-impact" name="impact" type="number" min="0" step="0.25" [(ngModel)]="form.riceImpact" />
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label for="e-conf">Confidence (0–1)</label>
              <input id="e-conf" name="conf" type="number" min="0" max="1" step="0.05" [(ngModel)]="form.riceConfidence" />
            </div>
            <div class="field">
              <label for="e-effort">Effort</label>
              <input id="e-effort" name="effort" type="number" min="0" step="0.5" [(ngModel)]="form.riceEffort" />
            </div>
          </div>
          <div class="rice-out">RICE score: <strong>{{ liveScore() === null ? '—' : (liveScore() | number: '1.0-2') }}</strong></div>

          <div class="form-row">
            <div class="field">
              <label for="e-status">Status</label>
              <select id="e-status" name="status" [(ngModel)]="form.status">
                @for (c of columns; track c.key) { <option [value]="c.key">{{ c.label }}</option> }
              </select>
            </div>
            <div class="field">
              <label for="e-outcome">Outcome</label>
              <select id="e-outcome" name="outcome" [(ngModel)]="form.outcome">
                <option value="">— none —</option>
                @for (o of outcomes; track o) { <option [value]="o">{{ cap(o) }}</option> }
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label for="e-start">Started</label>
              <input id="e-start" name="start" type="date" [(ngModel)]="form.startedAt" />
            </div>
            <div class="field">
              <label for="e-end">Ended</label>
              <input id="e-end" name="end" type="date" [(ngModel)]="form.endedAt" />
            </div>
          </div>
          <div class="field">
            <label for="e-learn">Learning</label>
            <textarea id="e-learn" name="learn" [(ngModel)]="form.learning" placeholder="What did this experiment teach you?"></textarea>
          </div>

          <div class="actions">
            <button type="button" class="btn btn-ghost" (click)="showForm.set(false)">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!form.title.trim() || saving()">
              {{ saving() ? 'Saving…' : (editing() ? 'Save changes' : 'Add experiment') }}
            </button>
          </div>
        </form>
      </app-modal>
    }
  `,
  styles: [`
    .bar { margin-bottom: 18px; flex-wrap: wrap; gap: 10px; }
    .board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    @media (max-width: 760px) { .board { grid-template-columns: 1fr; } }
    .col { background: var(--surface-2); border-radius: var(--r-lg); padding: 12px; min-height: 120px; }
    .col-head { display: flex; justify-content: space-between; font-weight: 800; font-size: 13px; margin-bottom: 10px; color: var(--text-soft); }
    .col-body { display: flex; flex-direction: column; gap: 10px; }
    .exp { padding: 13px; display: flex; flex-direction: column; gap: 8px; box-shadow: var(--shadow-sm); }
    .t { font-size: 14px; }
    .rice { background: var(--primary-soft); color: var(--primary-strong); }
    .hyp { margin: 0; font-size: 13px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    .meta { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .chip { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: var(--r-pill); background: var(--primary-soft); color: var(--primary-strong); }
    .learn { margin: 0; font-size: 12.5px; background: var(--accent-soft); color: var(--text); padding: 7px 10px; border-radius: var(--r-md); }
    .move { display: flex; flex-wrap: wrap; gap: 6px; padding-top: 8px; border-top: 1.5px solid var(--border); }
    .move-btn { border: 0; background: var(--surface-2); color: var(--text-soft); font-size: 11px; font-weight: 800; padding: 4px 9px; border-radius: var(--r-pill); cursor: pointer; transition: all 0.15s; }
    .move-btn:hover { background: var(--primary-soft); color: var(--primary-strong); }
    .move-btn.del:hover { background: var(--c-danger-bg); color: var(--c-danger); }
    .empty-col { text-align: center; font-size: 12px; padding: 8px 0; }
    .rice-out { background: var(--surface-2); border-radius: var(--r-md); padding: 11px 14px; font-size: 14px; font-weight: 700; color: var(--text-soft); margin-bottom: 8px; }
    .rice-out strong { color: var(--primary-strong); font-size: 16px; margin-left: 6px; }
    .actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
  `],
})
export class GrowthExperimentsComponent implements OnInit {
  private api = inject(GrowthService);
  private notify = inject(NotificationService);
  private confirm = inject(ConfirmService);

  readonly id = input.required<string>();

  readonly columns = COLUMNS;
  readonly outcomes = OUTCOMES;
  readonly sections = GROWTH_SECTIONS;

  readonly experiments = signal<GrowthExperiment[]>([]);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly editing = signal<GrowthExperiment | null>(null);
  readonly saving = signal(false);

  form: ExpForm = this.blank();
  readonly liveScore = computed(() => riceScore(this.form));

  ngOnInit(): void {
    this.load();
  }

  private blank(): ExpForm {
    return {
      title: '',
      hypothesis: '',
      section: 'high_tempo_testing',
      metric: '',
      riceReach: null,
      riceImpact: null,
      riceConfidence: null,
      riceEffort: null,
      status: 'backlog',
      outcome: '',
      learning: '',
      startedAt: '',
      endedAt: '',
    };
  }

  load(): void {
    this.loading.set(true);
    this.api.listExperiments(this.id()).subscribe({
      next: (res) => {
        this.experiments.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  forStatus(status: ExperimentStatus): GrowthExperiment[] {
    return this.experiments().filter((e) => (e.status ?? 'backlog') === status);
  }

  score(e: GrowthExperiment): number | null {
    return riceScore(e);
  }

  cap(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  sectionLabel(section: GrowthSection): string {
    const def = GROWTH_SECTIONS.find((s) => s.key === section);
    return def ? `${def.emoji} ${def.label}` : section;
  }

  openCreate(): void {
    this.editing.set(null);
    this.form = this.blank();
    this.showForm.set(true);
  }

  openEdit(e: GrowthExperiment): void {
    this.editing.set(e);
    this.form = {
      title: e.title,
      hypothesis: e.hypothesis ?? '',
      section: e.section ?? 'high_tempo_testing',
      metric: e.metric ?? '',
      riceReach: e.riceReach ?? null,
      riceImpact: e.riceImpact ?? null,
      riceConfidence: e.riceConfidence ?? null,
      riceEffort: e.riceEffort ?? null,
      status: e.status ?? 'backlog',
      outcome: e.outcome ?? '',
      learning: e.learning ?? '',
      startedAt: toDateInput(e.startedAt),
      endedAt: toDateInput(e.endedAt),
    };
    this.showForm.set(true);
  }

  private payload(): GrowthExperimentCreate {
    const f = this.form;
    return {
      title: f.title.trim(),
      hypothesis: f.hypothesis.trim() || null,
      section: f.section,
      metric: f.metric.trim() || null,
      riceReach: numOrNull(f.riceReach),
      riceImpact: numOrNull(f.riceImpact),
      riceConfidence: numOrNull(f.riceConfidence),
      riceEffort: numOrNull(f.riceEffort),
      status: f.status,
      outcome: f.outcome || undefined,
      learning: f.learning.trim() || null,
      startedAt: fromDateInput(f.startedAt),
      endedAt: fromDateInput(f.endedAt),
    };
  }

  save(): void {
    if (!this.form.title.trim() || this.saving()) return;
    this.saving.set(true);
    const editing = this.editing();
    const body = this.payload();
    const req = editing
      ? this.api.patchExperiment(this.id(), editing.id, body as GrowthExperimentPatch)
      : this.api.createExperiment(this.id(), body);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.notify.success(editing ? 'Experiment updated.' : 'Experiment added.');
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  move(e: GrowthExperiment, status: ExperimentStatus): void {
    this.experiments.update((list) => list.map((x) => (x.id === e.id ? { ...x, status } : x)));
    this.api.patchExperiment(this.id(), e.id, { status }).subscribe({ error: () => this.load() });
  }

  async remove(e: GrowthExperiment): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Delete experiment?',
      message: `“${e.title}” will be removed.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.api.deleteExperiment(this.id(), e.id).subscribe({
      next: () => {
        this.notify.success('Experiment deleted.');
        this.load();
      },
    });
  }
}

function numOrNull(v: number | null): number | null {
  return v === null || v === undefined || Number.isNaN(v) ? null : Number(v);
}
function toDateInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : '';
}
function fromDateInput(value: string): string | null {
  return value ? new Date(value + 'T00:00:00').toISOString() : null;
}
