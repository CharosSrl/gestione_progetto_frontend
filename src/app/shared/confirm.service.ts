import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface ActiveConfirm extends ConfirmOptions {
  resolve: (ok: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly active = signal<ActiveConfirm | null>(null);

  ask(options: ConfirmOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.active.set({ ...options, resolve });
    });
  }

  resolve(ok: boolean): void {
    const current = this.active();
    if (current) {
      current.resolve(ok);
      this.active.set(null);
    }
  }
}
