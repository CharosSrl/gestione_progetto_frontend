import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Feature, FeatureInput, Paginated } from '../models/models';

@Injectable({ providedIn: 'root' })
export class FeaturesService {
  private http = inject(HttpClient);
  private base(productId: string): string {
    return `${environment.apiUrl}/api/products/${productId}/features`;
  }

  list(productId: string, page = 1, pageSize = 20): Observable<Paginated<Feature>> {
    return this.http.get<Paginated<Feature>>(this.base(productId), { params: { page, pageSize } });
  }

  create(productId: string, input: FeatureInput): Observable<Feature> {
    return this.http.post<Feature>(this.base(productId), input);
  }

  update(productId: string, fid: string, input: FeatureInput): Observable<Feature> {
    return this.http.put<Feature>(`${this.base(productId)}/${fid}`, input);
  }

  delete(productId: string, fid: string): Observable<void> {
    return this.http.delete<void>(`${this.base(productId)}/${fid}`);
  }
}
