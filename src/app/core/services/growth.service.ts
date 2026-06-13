import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ExperimentStatus,
  GrowthCanvas,
  GrowthExperiment,
  GrowthExperimentCreate,
  GrowthExperimentPatch,
  GrowthNote,
  GrowthNoteCreate,
  GrowthNotePatch,
  Paginated,
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class GrowthService {
  private http = inject(HttpClient);
  private base(productId: string): string {
    return `${environment.apiUrl}/api/products/${productId}/growth`;
  }

  // --- Canvas notes ---

  getCanvas(productId: string): Observable<GrowthCanvas> {
    return this.http.get<GrowthCanvas>(`${this.base(productId)}/canvas`);
  }

  createNote(productId: string, body: GrowthNoteCreate): Observable<GrowthNote> {
    return this.http.post<GrowthNote>(`${this.base(productId)}/notes`, body);
  }

  patchNote(productId: string, noteId: string, body: GrowthNotePatch): Observable<GrowthNote> {
    return this.http.patch<GrowthNote>(`${this.base(productId)}/notes/${noteId}`, body);
  }

  deleteNote(productId: string, noteId: string): Observable<void> {
    return this.http.delete<void>(`${this.base(productId)}/notes/${noteId}`);
  }

  // --- Experiments ---

  listExperiments(
    productId: string,
    status?: ExperimentStatus,
    page = 1,
    pageSize = 100,
  ): Observable<Paginated<GrowthExperiment>> {
    const params: Record<string, string | number> = { page, pageSize };
    if (status) params['status'] = status;
    return this.http.get<Paginated<GrowthExperiment>>(`${this.base(productId)}/experiments`, { params });
  }

  createExperiment(productId: string, body: GrowthExperimentCreate): Observable<GrowthExperiment> {
    return this.http.post<GrowthExperiment>(`${this.base(productId)}/experiments`, body);
  }

  patchExperiment(
    productId: string,
    experimentId: string,
    body: GrowthExperimentPatch,
  ): Observable<GrowthExperiment> {
    return this.http.patch<GrowthExperiment>(`${this.base(productId)}/experiments/${experimentId}`, body);
  }

  deleteExperiment(productId: string, experimentId: string): Observable<void> {
    return this.http.delete<void>(`${this.base(productId)}/experiments/${experimentId}`);
  }
}
