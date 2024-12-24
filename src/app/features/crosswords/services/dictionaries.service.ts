import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DictionaryService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  getDictionaries(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/crosswords/dictionaries`);
  }

  deleteDictionary(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/crosswords/dictionaries/${id}`);
  }
  

  uploadDictionary(data: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/crosswords/dictionaries/`, data);
  }
}
