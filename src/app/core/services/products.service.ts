import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Paginated, Product, ProductInput, ProductWithCounts } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/products`;

  list(page = 1, pageSize = 20): Observable<Paginated<ProductWithCounts>> {
    return this.http.get<Paginated<ProductWithCounts>>(this.base, { params: { page, pageSize } });
  }

  get(id: string): Observable<ProductWithCounts> {
    return this.http.get<ProductWithCounts>(`${this.base}/${id}`);
  }

  create(input: ProductInput): Observable<Product> {
    return this.http.post<Product>(this.base, input);
  }

  update(id: string, input: ProductInput): Observable<Product> {
    return this.http.put<Product>(`${this.base}/${id}`, input);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
