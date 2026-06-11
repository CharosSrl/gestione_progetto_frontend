import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Kpi, KpiInput, KpiValue, KpiValueInput, KpiWithValues } from '../models/models';

@Injectable({ providedIn: 'root' })
export class KpisService {
  private http = inject(HttpClient);
  private base(productId: string): string {
    return `${environment.apiUrl}/api/products/${productId}/kpis`;
  }

  list(productId: string): Observable<KpiWithValues[]> {
    return this.http.get<KpiWithValues[]>(this.base(productId));
  }

  create(productId: string, input: KpiInput): Observable<Kpi> {
    return this.http.post<Kpi>(this.base(productId), input);
  }

  update(productId: string, kid: string, input: KpiInput): Observable<Kpi> {
    return this.http.put<Kpi>(`${this.base(productId)}/${kid}`, input);
  }

  listValues(productId: string, kid: string): Observable<KpiValue[]> {
    return this.http.get<KpiValue[]>(`${this.base(productId)}/${kid}/values`);
  }

  logValue(productId: string, kid: string, input: KpiValueInput): Observable<KpiValue> {
    return this.http.post<KpiValue>(`${this.base(productId)}/${kid}/values`, input);
  }
}
