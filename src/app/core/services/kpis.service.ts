import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Kpi, KpiInput, KpiValue, KpiValueInput, KpiWithValues, Paginated } from '../models/models';

@Injectable({ providedIn: 'root' })
export class KpisService {
  private http = inject(HttpClient);
  private base(productId: string): string {
    return `${environment.apiUrl}/api/products/${productId}/kpis`;
  }

  list(productId: string, page = 1, pageSize = 20): Observable<Paginated<KpiWithValues>> {
    return this.http.get<Paginated<KpiWithValues>>(this.base(productId), { params: { page, pageSize } });
  }

  create(productId: string, input: KpiInput): Observable<Kpi> {
    return this.http.post<Kpi>(this.base(productId), input);
  }

  update(productId: string, kid: string, input: KpiInput): Observable<Kpi> {
    return this.http.put<Kpi>(`${this.base(productId)}/${kid}`, input);
  }

  listValues(productId: string, kid: string, page = 1, pageSize = 100): Observable<Paginated<KpiValue>> {
    return this.http.get<Paginated<KpiValue>>(`${this.base(productId)}/${kid}/values`, {
      params: { page, pageSize },
    });
  }

  logValue(productId: string, kid: string, input: KpiValueInput): Observable<KpiValue> {
    return this.http.post<KpiValue>(`${this.base(productId)}/${kid}/values`, input);
  }
}
