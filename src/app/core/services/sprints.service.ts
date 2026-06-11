import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Sprint, SprintInput, Task, TaskInput } from '../models/models';

@Injectable({ providedIn: 'root' })
export class SprintsService {
  private http = inject(HttpClient);
  private base(productId: string): string {
    return `${environment.apiUrl}/api/products/${productId}/sprints`;
  }
  private tasksBase(productId: string, sprintId: string): string {
    return `${this.base(productId)}/${sprintId}/tasks`;
  }

  list(productId: string): Observable<Sprint[]> {
    return this.http.get<Sprint[]>(this.base(productId));
  }

  create(productId: string, input: SprintInput): Observable<Sprint> {
    return this.http.post<Sprint>(this.base(productId), input);
  }

  update(productId: string, sid: string, input: SprintInput): Observable<Sprint> {
    return this.http.put<Sprint>(`${this.base(productId)}/${sid}`, input);
  }

  // --- Tasks (nested under a sprint) ---

  listTasks(productId: string, sprintId: string): Observable<Task[]> {
    return this.http.get<Task[]>(this.tasksBase(productId, sprintId));
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
