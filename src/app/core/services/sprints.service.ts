import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Paginated, Sprint, SprintInput, Task, TaskInput } from '../models/models';

@Injectable({ providedIn: 'root' })
export class SprintsService {
  private http = inject(HttpClient);
  private base(productId: string): string {
    return `${environment.apiUrl}/api/products/${productId}/sprints`;
  }
  private tasksBase(productId: string, sprintId: string): string {
    return `${this.base(productId)}/${sprintId}/tasks`;
  }

  list(productId: string, page = 1, pageSize = 20): Observable<Paginated<Sprint>> {
    return this.http.get<Paginated<Sprint>>(this.base(productId), { params: { page, pageSize } });
  }

  create(productId: string, input: SprintInput): Observable<Sprint> {
    return this.http.post<Sprint>(this.base(productId), input);
  }

  update(productId: string, sid: string, input: SprintInput): Observable<Sprint> {
    return this.http.put<Sprint>(`${this.base(productId)}/${sid}`, input);
  }

  // --- Tasks (nested under a sprint) ---

  listTasks(productId: string, sprintId: string, page = 1, pageSize = 100): Observable<Paginated<Task>> {
    return this.http.get<Paginated<Task>>(this.tasksBase(productId, sprintId), {
      params: { page, pageSize },
    });
  }

  createTask(productId: string, sprintId: string, input: TaskInput): Observable<Task> {
    return this.http.post<Task>(this.tasksBase(productId, sprintId), input);
  }

  updateTask(productId: string, sprintId: string, tid: string, input: TaskInput): Observable<Task> {
    return this.http.put<Task>(`${this.tasksBase(productId, sprintId)}/${tid}`, input);
  }

  deleteTask(productId: string, sprintId: string, tid: string): Observable<void> {
    return this.http.delete<void>(`${this.tasksBase(productId, sprintId)}/${tid}`);
  }
}
