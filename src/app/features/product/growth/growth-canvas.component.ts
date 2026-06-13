import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GrowthService } from '../../../core/services/growth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmService } from '../../../shared/confirm.service';
import { GrowthCanvas, GrowthNote, GrowthSection } from '../../../core/models/models';
import { ModalComponent } from '../../../shared/modal.component';
import { SpinnerComponent } from '../../../shared/spinner.component';
import { GROWTH_SECTIONS, GrowthSectionDef, humaniseField } from './growth-fields';

@Component({
  selector: 'app-growth-canvas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ModalComponent, SpinnerComponent],
  template: `
    <p class="muted intro">Your growth-hacking canvas — capture sticky notes under each area as your thinking evolves.</p>

    @if (loading()) {
      <app-spinner label="Loading canvas…" />
    } @else {
      <div class="layout">
        <aside class="rail">
          @for (section of sections; track section.key) {
            <button type="button" class="sec-item" [class.sel]="selectedSection() === section.key"
                    (click)="selectedSection.set(section.key)">
              <span class="ic">{{ section.emoji }}</span>
              <span class="lbl">{{ section.label }}</span>
              @if (countFor(section.key); as n) { <span class="cnt">{{ n }}</span> }
            </button>
          }
        </aside>

        @if (current(); as sec) {
          <section class="card detail">
            <div class="detail-head">
              <h3>{{ sec.emoji }} {{ sec.label }}</h3>
              <span class="faint">{{ sec.hint }}</span>
            </div>
            <div class="fields">
              @for (field of sec.fields; track field) {
                <div class="field-block">
                  <div class="fb-head">
                    <span class="fname">{{ label(field) }}</span>
                    <button type="button" class="add" (click)="openCreate(sec.key, field)" aria-label="Add note">＋</button>
                  </div>
                  <div class="notes">
                    @for (note of notesFor(sec.key, field); track note.id) {
                      <div class="note" (click)="openEdit(note)">
                        <span class="note-text">{{ note.content }}</span>
                        <button type="button" class="note-del" (click)="remove(note, $event)" aria-label="Delete">✕</button>
                      </div>
                    } @empty {
                      <button type="button" class="note empty" (click)="openCreate(sec.key, field)">＋ Add a note</button>
                    }
                  </div>
                </div>
              }
            </div>
          </section>
        }
      </div>
    }

    @if (showForm()) {
      <app-modal [title]="editing() ? 'Edit note' : 'New note'" (close)="showForm.set(false)">
        <p class="ctx faint">{{ formContext() }}</p>
        <form (ngSubmit)="save()">
          <div class="field">
            <label for="n-content">Note</label>
            <textarea id="n-content" name="content" [(ngModel)]="content" required autofocus
                      placeholder="Write your idea, insight or assumption…"></textarea>
          </div>
          <div class="actions">
            <button type="button" class="btn btn-ghost" (click)="showForm.set(false)">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="!content.trim() || saving()">
              {{ saving() ? 'Saving…' : (editing() ? 'Save changes' : 'Add note') }}
            </button>
          </div>
        </form>
      </app-modal>
    }
  `,
  styles: [`
    .intro { margin: 0 0 18px; }

    .layout { display: grid; grid-template-columns: 250px 1fr; gap: 18px; align-items: start; }

    /* Left rail — section navigation */
    .rail { display: flex; flex-direction: column; gap: 8px; position: sticky; top: 84px; }
    .sec-item {
      display: flex; align-items: center; gap: 11px;
      padding: 12px 14px; border-radius: var(--r-md);
      border: 1.5px solid var(--border); background: var(--surface);
      font-weight: 800; font-size: 14px; color: var(--text-soft);
      cursor: pointer; text-align: left; transition: all 0.15s;
    }
    .sec-item:hover { border-color: var(--border-strong); color: var(--text); }
    .sec-item.sel { border-color: var(--primary); background: var(--primary-soft); color: var(--primary-strong); box-shadow: 0 0 0 4px var(--primary-soft); }
    .sec-item .ic { font-size: 18px; line-height: 1; }
    .sec-item .lbl { flex: 1; }
    .sec-item .cnt {
      font-size: 12px; font-weight: 900; min-width: 22px; text-align: center;
      padding: 1px 7px; border-radius: var(--r-pill);
      background: var(--primary-soft); color: var(--primary-strong);
    }
    .sec-item.sel .cnt { background: var(--surface); }

    /* Right detail panel */
    .detail { display: flex; flex-direction: column; gap: 20px; }
    .detail-head h3 { font-size: 19px; }
    .detail-head .faint { font-size: 13px; }
    .fields { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 18px; }

    @media (max-width: 860px) {
      .layout { grid-template-columns: 1fr; gap: 14px; }
      .rail {
        position: static; flex-direction: row; overflow-x: auto;
        gap: 8px; padding-bottom: 4px; -webkit-overflow-scrolling: touch;
      }
      .sec-item { flex: 0 0 auto; padding: 9px 13px; }
      .fields { grid-template-columns: 1fr; }
    }
    .field-block { display: flex; flex-direction: column; gap: 7px; }
    .fb-head { display: flex; align-items: center; justify-content: space-between; }
    .fname { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-faint); }
    .add { border: 0; background: var(--primary-soft); color: var(--primary-strong); width: 24px; height: 24px; border-radius: var(--r-pill); font-weight: 900; cursor: pointer; line-height: 1; }
    .add:hover { filter: brightness(1.06); }
    .notes { display: flex; flex-direction: column; gap: 6px; }
    .note {
      position: relative; display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;
      background: var(--accent-soft); color: var(--text); border-radius: var(--r-md);
      padding: 9px 11px; font-size: 13.5px; cursor: pointer; transition: transform 0.1s, box-shadow 0.15s; text-align: left;
    }
    .note:hover { box-shadow: var(--shadow-sm); transform: translateY(-1px); }
    .note-text { white-space: pre-wrap; word-break: break-word; }
    .note-del { border: 0; background: transparent; color: var(--text-faint); cursor: pointer; font-size: 12px; opacity: 0; transition: opacity 0.15s; flex-shrink: 0; }
    .note:hover .note-del { opacity: 1; }
    .note-del:hover { color: var(--c-danger); }
    .note.empty { background: transparent; border: 1.5px dashed var(--border-strong); color: var(--text-faint); font-weight: 700; justify-content: center; }
    .note.empty:hover { border-color: var(--primary); color: var(--primary-strong); transform: none; box-shadow: none; }
    .ctx { margin: -4px 0 14px; font-size: 13px; font-weight: 700; }
    .actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
  `],
})
export class GrowthCanvasComponent implements OnInit {
  private api = inject(GrowthService);
  private notify = inject(NotificationService);
  private confirm = inject(ConfirmService);

  readonly id = input.required<string>();

  readonly sections = GROWTH_SECTIONS;
  readonly canvas = signal<GrowthCanvas | null>(null);
  readonly loading = signal(true);

  readonly selectedSection = signal<GrowthSection>('project_overview');
  readonly current = computed<GrowthSectionDef | undefined>(() =>
    GROWTH_SECTIONS.find((s) => s.key === this.selectedSection()),
  );

  readonly showForm = signal(false);
  readonly editing = signal<GrowthNote | null>(null);
  readonly saving = signal(false);

  private targetSection: GrowthSection = 'project_overview';
  private targetField = '';
  content = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getCanvas(this.id()).subscribe({
      next: (c) => {
        this.canvas.set(c);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  label(field: string): string {
    return humaniseField(field);
  }

  notesFor(section: GrowthSection, field: string): GrowthNote[] {
    return this.canvas()?.[section]?.[field] ?? [];
  }

  /** Total notes across all fields of a section (for the rail count badge). */
  countFor(section: GrowthSection): number {
    const fields = this.canvas()?.[section];
    if (!fields) return 0;
    return Object.values(fields).reduce((sum, notes) => sum + notes.length, 0);
  }

  formContext(): string {
    const sec = GROWTH_SECTIONS.find((s) => s.key === this.targetSection);
    return `${sec?.emoji ?? ''} ${sec?.label ?? ''} · ${humaniseField(this.targetField)}`;
  }

  openCreate(section: GrowthSection, field: string): void {
    this.editing.set(null);
    this.targetSection = section;
    this.targetField = field;
    this.content = '';
    this.showForm.set(true);
  }

  openEdit(note: GrowthNote): void {
    this.editing.set(note);
    this.targetSection = note.section;
    this.targetField = note.field;
    this.content = note.content;
    this.showForm.set(true);
  }

  save(): void {
    if (!this.content.trim() || this.saving()) return;
    this.saving.set(true);
    const editing = this.editing();
    const req = editing
      ? this.api.patchNote(this.id(), editing.id, { content: this.content.trim() })
      : this.api.createNote(this.id(), {
          section: this.targetSection,
          field: this.targetField,
          content: this.content.trim(),
        });
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.notify.success(editing ? 'Note updated.' : 'Note added.');
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  async remove(note: GrowthNote, ev: Event): Promise<void> {
    ev.stopPropagation();
    const ok = await this.confirm.ask({
      title: 'Delete note?',
      message: 'This note will be removed from the canvas.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.api.deleteNote(this.id(), note.id).subscribe({
      next: () => {
        this.notify.success('Note deleted.');
        this.load();
      },
    });
  }
}
