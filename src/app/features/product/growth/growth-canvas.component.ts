import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GrowthService } from '../../../core/services/growth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmService } from '../../../shared/confirm.service';
import { GrowthCanvas, GrowthNote, GrowthSection } from '../../../core/models/models';
import { ModalComponent } from '../../../shared/modal.component';
import { SpinnerComponent } from '../../../shared/spinner.component';
import { GROWTH_SECTIONS, humaniseField } from './growth-fields';

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
      <div class="canvas">
        @for (section of sections; track section.key) {
          <section class="card sec">
            <div class="sec-head">
              <h3>{{ section.emoji }} {{ section.label }}</h3>
              <span class="faint">{{ section.hint }}</span>
            </div>
            <div class="fields">
              @for (field of section.fields; track field) {
                <div class="field-block">
                  <div class="fb-head">
                    <span class="fname">{{ label(field) }}</span>
                    <button type="button" class="add" (click)="openCreate(section.key, field)" aria-label="Add note">＋</button>
                  </div>
                  <div class="notes">
                    @for (note of notesFor(section.key, field); track note.id) {
                      <div class="note" (click)="openEdit(note)">
                        <span class="note-text">{{ note.content }}</span>
                        <button type="button" class="note-del" (click)="remove(note, $event)" aria-label="Delete">✕</button>
                      </div>
                    } @empty {
                      <button type="button" class="note empty" (click)="openCreate(section.key, field)">＋ Add a note</button>
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
    .canvas { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--s-4); align-items: start; }
    .sec { display: flex; flex-direction: column; gap: 14px; }
    .sec-head h3 { font-size: 16px; }
    .sec-head .faint { font-size: 12px; }
    .fields { display: flex; flex-direction: column; gap: 14px; }
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
