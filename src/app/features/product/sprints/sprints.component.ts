import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SprintsService } from '../../../core/services/sprints.service';
import { FeaturesService } from '../../../core/services/features.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmService } from '../../../shared/confirm.service';
import {
  Feature,
  PaginationMeta,
  Sprint,
  SprintInput,
  SprintStatus,
  Task,
  TaskInput,
  TaskStatus,
} from '../../../core/models/models';
import { BadgeComponent } from '../../../shared/badge.component';
import { ModalComponent } from '../../../shared/modal.component';
import { SpinnerComponent } from '../../../shared/spinner.component';
import { EmptyStateComponent } from '../../../shared/empty-state.component';
import { PaginatorComponent } from '../../../shared/paginator.component';

const SPRINT_STATUSES: SprintStatus[] = ['planned', 'active', 'completed'];
const TASK_COLUMNS: { key: TaskStatus; label: string; emoji: string }[] = [
  { key: 'todo', label: 'To do', emoji: '📋' },
  { key: 'in_progress', label: 'In progress', emoji: '🔧' },
  { key: 'done', label: 'Done', emoji: '✅' },
];

@Component({
  selector: 'app-sprints',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DatePipe,
    BadgeComponent,
    ModalComponent,
    SpinnerComponent,
    EmptyStateComponent,
    PaginatorComponent,
  ],
  template: `
    <div class="spread bar">
      <p class="muted">Plan sprints and break the work down into tasks.</p>
      <button type="button" class="btn btn-primary btn-sm" (click)="openSprintCreate()">＋ New sprint</button>
    </div>

    @if (loading()) {
      <app-spinner label="Loading sprints…" />
    } @else if (sprints().length === 0) {
      <div class="card">
        <app-empty-state emoji="🏃" title="No sprints yet"
          subtitle="Create a sprint to start planning tasks.">
          <button type="button" class="btn btn-primary" (click)="openSprintCreate()">＋ Create a sprint</button>
        </app-empty-state>
      </div>
    } @else {
      <div class="layout">
        <aside class="sprint-list">
          @for (s of sprints(); track s.id) {
            <button type="button" class="card sprint" [class.sel]="selectedId() === s.id" (click)="select(s.id)">
              <div class="spread">
                <strong class="s-name">{{ s.name }}</strong>
                <app-badge kind="sprint" [value]="s.status" />
              </div>
              @if (s.goal) { <p class="muted s-goal">{{ s.goal }}</p> }
              @if (s.startDate || s.endDate) {
                <p class="faint dates">
                  {{ s.startDate ? (s.startDate | date: 'mediumDate') : '—' }}
                  → {{ s.endDate ? (s.endDate | date: 'mediumDate') : '—' }}
                </p>
              }
            </button>
          }
          <app-paginator [meta]="meta()" (pageChange)="goTo($event)" />
        </aside>

        <section class="board-wrap">
          @if (selected(); as s) {
            <div class="spread board-head">
              <div class="row">
                <h3>{{ s.name }}</h3>
                <app-badge kind="sprint" [value]="s.status" />
              </div>
              <div class="row">
                <button type="button" class="btn btn-ghost btn-sm" (click)="openSprintEdit(s)">✎ Edit</button>
                <button type="button" class="btn btn-primary btn-sm" (click)="openTaskCreate()">＋ Task</button>
              </div>
            </div>

            @if (tasksLoading()) {
              <app-spinner label="Loading tasks…" />
            } @else {
              <div class="board">
                @for (col of columns; track col.key) {
                  <div class="col">
                    <div class="col-head">
                      <span>{{ col.emoji }} {{ col.label }}</span>
                      <span class="faint">{{ tasksFor(col.key).length }}</span>
                    </div>
                    <div class="col-body">
                      @for (t of tasksFor(col.key); track t.id) {
                        <div class="card task">
                          <div class="spread">
                            <strong class="t-title">{{ t.title }}</strong>
                            <button type="button" class="mini" (click)="openTaskEdit(t)" aria-label="Edit">✎</button>
                          </div>
                          @if (t.description) { <p class="muted t-desc">{{ t.description }}</p> }
                          <div class="t-meta">
                            @if (featureName(t.featureId); as fn) {
                              <span class="chip">🧩 {{ fn }}</span>
                            }
                            @if (t.estimatedHours != null) { <span class="chip">~{{ t.estimatedHours }}h</span> }
                            @if (t.actualHours != null) { <span class="chip">⏱ {{ t.actualHours }}h</span> }
                          </div>
                          <div class="move">
                            @for (c of columns; track c.key) {
                              @if (c.key !== t.status) {
                                <button type="button" class="move-btn" (click)="moveTask(t, c.key)">→ {{ c.label }}</button>
                              }
                            }
                            <button type="button" class="move-btn del" (click)="removeTask(t)">Delete</button>
                          </div>
                        </div>
                      }
                      @if (tasksFor(col.key).length === 0) {
                        <p class="faint empty-col">Nothing here</p>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          } @else {
            <div class="card"><p class="muted pick">← Select a sprint to see its tasks.</p></div>
          }
        </section>
      </div>
    }

    <!-- Sprint modal -->
    @if (showSprintForm()) {
      <app-modal [title]="editingSprint() ? 'Edit sprint' : 'New sprint'" (close)="showSprintForm.set(false)">
        <form (ngSubmit)="saveSprint()">
          <div class="field">
            <label for="s-name">Name</label>
            <input id="s-name" name="name" [(ngModel)]="sprintForm.name" maxlength="200" required
                   placeholder="e.g. Sprint 1 — Foundations" autocomplete="off" />
          </div>
          <div class="field">
            <label for="s-goal">Goal</label>
            <textarea id="s-goal" name="goal" [(ngModel)]="sprintForm.goal" placeholder="What should this sprint achieve?"></textarea>
          </div>
          <div class="form-row">
            <div class="field">
              <label for="s-start">Start date</label>
              <input id="s-start" name="start" type="date" [(ngModel)]="sprintForm.startDate" />
            </div>
            <div class="field">
              <label for="s-end">End date</label>
              <input id="s-end" name="end" type="date" [(ngModel)]="sprintForm.endDate" />
            </div>
          </div>
          <div class="field">
            <label>Status</label>
            <div class="seg">
              @for (s of sprintStatuses; track s) {
                <button type="button" class="seg-opt" [class.on]="sprintForm.status === s" (click)="sprintForm.status = s">
                  {{ cap(s) }}
                </button>
              }
            </div>
          </div>
          <div class="actions">
            <button type="button" class="btn btn-ghost" (click)="showSprintForm.set(false)">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!sprintForm.name.trim() || saving()">
              {{ saving() ? 'Saving…' : (editingSprint() ? 'Save changes' : 'Create sprint') }}
            </button>
          </div>
        </form>
      </app-modal>
    }

    <!-- Task modal -->
    @if (showTaskForm()) {
      <app-modal [title]="editingTask() ? 'Edit task' : 'New task'" (close)="showTaskForm.set(false)">
        <form (ngSubmit)="saveTask()">
          <div class="field">
            <label for="t-title">Title</label>
            <input id="t-title" name="title" [(ngModel)]="taskForm.title" maxlength="200" required
                   placeholder="e.g. Build the login screen" autocomplete="off" />
          </div>
          <div class="field">
            <label for="t-desc">Description</label>
            <textarea id="t-desc" name="tdesc" [(ngModel)]="taskForm.description"></textarea>
          </div>
          <div class="form-row">
            <div class="field">
              <label for="t-status">Status</label>
              <select id="t-status" name="tstatus" [(ngModel)]="taskForm.status">
                @for (c of columns; track c.key) { <option [value]="c.key">{{ c.label }}</option> }
              </select>
            </div>
            <div class="field">
              <label for="t-feature">Linked feature</label>
              <select id="t-feature" name="tfeature" [(ngModel)]="taskForm.featureId">
                <option [ngValue]="null">— none —</option>
                @for (f of features(); track f.id) { <option [ngValue]="f.id">{{ f.title }}</option> }
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label for="t-est">Estimated hours</label>
              <input id="t-est" name="test" type="number" min="0" step="0.5" [(ngModel)]="taskForm.estimatedHours" />
            </div>
            <div class="field">
              <label for="t-act">Actual hours</label>
              <input id="t-act" name="tact" type="number" min="0" step="0.5" [(ngModel)]="taskForm.actualHours" />
            </div>
          </div>
          <div class="actions">
            <button type="button" class="btn btn-ghost" (click)="showTaskForm.set(false)">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!taskForm.title.trim() || saving()">
              {{ saving() ? 'Saving…' : (editingTask() ? 'Save changes' : 'Add task') }}
            </button>
          </div>
        </form>
      </app-modal>
    }
  `,
  styles: [`
    .bar { margin-bottom: 18px; flex-wrap: wrap; gap: 10px; }
    .layout { display: grid; grid-template-columns: 300px 1fr; gap: 18px; align-items: start; }
    @media (max-width: 860px) { .layout { grid-template-columns: 1fr; } }
    .sprint-list { display: flex; flex-direction: column; gap: 10px; }
    .sprint {
      text-align: left; cursor: pointer; border: 1.5px solid var(--border);
      display: flex; flex-direction: column; gap: 6px; padding: 14px 16px; transition: all 0.15s;
    }
    .sprint:hover { border-color: var(--border-strong); }
    .sprint.sel { border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-soft); }
    .s-name { font-size: 15px; }
    .s-goal { margin: 0; font-size: 13px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .dates { margin: 0; font-size: 12px; font-weight: 700; }
    .board-head { margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
    .board-head h3 { font-size: 18px; }
    .board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    @media (max-width: 720px) { .board { grid-template-columns: 1fr; } }
    .col { background: var(--surface-2); border-radius: var(--r-lg); padding: 12px; min-height: 120px; }
    .col-head { display: flex; justify-content: space-between; font-weight: 800; font-size: 13px; margin-bottom: 10px; color: var(--text-soft); }
    .col-body { display: flex; flex-direction: column; gap: 10px; }
    .task { padding: 12px; display: flex; flex-direction: column; gap: 7px; box-shadow: var(--shadow-sm); }
    .t-title { font-size: 14px; }
    .mini { border: 0; background: transparent; cursor: pointer; color: var(--text-faint); font-size: 13px; }
    .mini:hover { color: var(--primary-strong); }
    .t-desc { margin: 0; font-size: 12.5px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .t-meta { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: var(--r-pill); background: var(--primary-soft); color: var(--primary-strong); }
    .move { display: flex; flex-wrap: wrap; gap: 6px; padding-top: 7px; border-top: 1.5px solid var(--border); }
    .move-btn { border: 0; background: var(--surface-2); color: var(--text-soft); font-size: 11px; font-weight: 800; padding: 4px 9px; border-radius: var(--r-pill); cursor: pointer; transition: all 0.15s; }
    .move-btn:hover { background: var(--primary-soft); color: var(--primary-strong); }
    .move-btn.del:hover { background: var(--c-danger-bg); color: var(--c-danger); }
    .empty-col { text-align: center; font-size: 12px; padding: 8px 0; }
    .pick { margin: 0; }
    .seg { display: flex; gap: 8px; flex-wrap: wrap; }
    .seg-opt {
      flex: 1; min-width: 80px; padding: 9px; border-radius: var(--r-md);
      border: 1.5px solid var(--border-strong); background: var(--surface);
      font-weight: 800; font-size: 13px; color: var(--text-soft); cursor: pointer; transition: all 0.15s;
    }
    .seg-opt.on { background: var(--primary-soft); border-color: var(--primary); color: var(--primary-strong); }
    .actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
  `],
})
export class SprintsComponent implements OnInit {
  private api = inject(SprintsService);
  private featuresApi = inject(FeaturesService);
  private notify = inject(NotificationService);
  private confirm = inject(ConfirmService);

  readonly id = input.required<string>();

  readonly columns = TASK_COLUMNS;
  readonly sprintStatuses = SPRINT_STATUSES;

  readonly sprints = signal<Sprint[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly page = signal(1);
  readonly features = signal<Feature[]>([]);
  readonly loading = signal(true);
  readonly selectedId = signal<string | null>(null);

  readonly tasks = signal<Task[]>([]);
  readonly tasksLoading = signal(false);

  readonly showSprintForm = signal(false);
  readonly editingSprint = signal<Sprint | null>(null);
  readonly showTaskForm = signal(false);
  readonly editingTask = signal<Task | null>(null);
  readonly saving = signal(false);

  readonly selected = computed(() => this.sprints().find((s) => s.id === this.selectedId()) ?? null);

  sprintForm: { name: string; goal: string; startDate: string; endDate: string; status: SprintStatus } = {
    name: '',
    goal: '',
    startDate: '',
    endDate: '',
    status: 'planned',
  };

  taskForm: {
    title: string;
    description: string;
    status: TaskStatus;
    featureId: string | null;
    estimatedHours: number | null;
    actualHours: number | null;
  } = this.blankTask();

  ngOnInit(): void {
    this.load();
    // Load features (first 100) to populate the task's "linked feature" dropdown.
    this.featuresApi.list(this.id(), 1, 100).subscribe({ next: (res) => this.features.set(res.data) });
  }

  private blankTask() {
    return {
      title: '',
      description: '',
      status: 'todo' as TaskStatus,
      featureId: null as string | null,
      estimatedHours: null as number | null,
      actualHours: null as number | null,
    };
  }

  load(): void {
    this.loading.set(true);
    this.api.list(this.id(), this.page()).subscribe({
      next: (res) => {
        this.sprints.set(res.data);
        this.meta.set(res.meta);
        this.loading.set(false);
        if (res.data.length && !this.selectedId()) {
          this.select(res.data[0].id);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  goTo(page: number): void {
    this.page.set(page);
    this.load();
  }

  select(sprintId: string): void {
    this.selectedId.set(sprintId);
    this.loadTasks();
  }

  loadTasks(): void {
    const sid = this.selectedId();
    if (!sid) return;
    this.tasksLoading.set(true);
    this.api.listTasks(this.id(), sid).subscribe({
      next: (res) => {
        this.tasks.set(res.data);
        this.tasksLoading.set(false);
      },
      error: () => this.tasksLoading.set(false),
    });
  }

  tasksFor(status: TaskStatus): Task[] {
    return this.tasks().filter((t) => (t.status ?? 'todo') === status);
  }

  featureName(featureId: string | null | undefined): string | null {
    if (!featureId) return null;
    return this.features().find((f) => f.id === featureId)?.title ?? null;
  }

  cap(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // ---- Sprint CRUD ----
  openSprintCreate(): void {
    this.editingSprint.set(null);
    this.sprintForm = { name: '', goal: '', startDate: '', endDate: '', status: 'planned' };
    this.showSprintForm.set(true);
  }

  openSprintEdit(s: Sprint): void {
    this.editingSprint.set(s);
    this.sprintForm = {
      name: s.name,
      goal: s.goal ?? '',
      startDate: toDateInput(s.startDate),
      endDate: toDateInput(s.endDate),
      status: s.status ?? 'planned',
    };
    this.showSprintForm.set(true);
  }

  saveSprint(): void {
    if (!this.sprintForm.name.trim() || this.saving()) return;
    const f = this.sprintForm;
    const payload: SprintInput = {
      name: f.name.trim(),
      goal: f.goal.trim() || null,
      startDate: fromDateInput(f.startDate),
      endDate: fromDateInput(f.endDate),
      status: f.status,
    };
    this.saving.set(true);
    const editing = this.editingSprint();
    const req = editing ? this.api.update(this.id(), editing.id, payload) : this.api.create(this.id(), payload);
    req.subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.showSprintForm.set(false);
        this.notify.success(editing ? 'Sprint updated.' : 'Sprint created.');
        if (!editing) this.page.set(1);
        this.api.list(this.id(), this.page()).subscribe({
          next: (res) => {
            this.sprints.set(res.data);
            this.meta.set(res.meta);
            if (!editing) this.select(saved.id);
          },
        });
      },
      error: () => this.saving.set(false),
    });
  }

  // ---- Task CRUD ----
  openTaskCreate(): void {
    this.editingTask.set(null);
    this.taskForm = this.blankTask();
    this.showTaskForm.set(true);
  }

  openTaskEdit(t: Task): void {
    this.editingTask.set(t);
    this.taskForm = {
      title: t.title,
      description: t.description ?? '',
      status: t.status ?? 'todo',
      featureId: t.featureId ?? null,
      estimatedHours: t.estimatedHours ?? null,
      actualHours: t.actualHours ?? null,
    };
    this.showTaskForm.set(true);
  }

  saveTask(): void {
    const sid = this.selectedId();
    if (!sid || !this.taskForm.title.trim() || this.saving()) return;
    const f = this.taskForm;
    const payload: TaskInput = {
      title: f.title.trim(),
      description: f.description.trim() || null,
      status: f.status,
      featureId: f.featureId || null,
      estimatedHours: numOrNull(f.estimatedHours),
      actualHours: numOrNull(f.actualHours),
    };
    this.saving.set(true);
    const editing = this.editingTask();
    const req = editing
      ? this.api.updateTask(this.id(), sid, editing.id, payload)
      : this.api.createTask(this.id(), sid, payload);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.showTaskForm.set(false);
        this.notify.success(editing ? 'Task updated.' : 'Task added.');
        this.loadTasks();
      },
      error: () => this.saving.set(false),
    });
  }

  moveTask(t: Task, status: TaskStatus): void {
    const sid = this.selectedId();
    if (!sid) return;
    const payload: TaskInput = {
      title: t.title,
      description: t.description ?? null,
      status,
      featureId: t.featureId ?? null,
      estimatedHours: t.estimatedHours ?? null,
      actualHours: t.actualHours ?? null,
    };
    // Optimistic update.
    this.tasks.update((list) => list.map((x) => (x.id === t.id ? { ...x, status } : x)));
    this.api.updateTask(this.id(), sid, t.id, payload).subscribe({
      error: () => this.loadTasks(),
    });
  }

  async removeTask(t: Task): Promise<void> {
    const sid = this.selectedId();
    if (!sid) return;
    const ok = await this.confirm.ask({
      title: 'Delete task?',
      message: `“${t.title}” will be removed.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.api.deleteTask(this.id(), sid, t.id).subscribe({
      next: () => {
        this.notify.success('Task deleted.');
        this.loadTasks();
      },
    });
  }
}

function numOrNull(v: number | null): number | null {
  return v === null || v === undefined || Number.isNaN(v) ? null : Number(v);
}

// Convert an ISO datetime to a yyyy-MM-dd value for <input type="date">.
function toDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

// Convert a date-input value back to an ISO datetime (or null).
function fromDateInput(value: string): string | null {
  if (!value) return null;
  return new Date(value + 'T00:00:00').toISOString();
}
