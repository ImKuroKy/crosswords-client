import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CrosswordsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUserId(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/crosswords/user`);
  }

  getCrosswords(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/crosswords/library`);
  }

  getUserCrosswords(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/crosswords/user/library`);
  }

  addCrosswordToLibrary(crosswordId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/crosswords/add`, {
      id: crosswordId,
    });
  }

  deleteCrosswordFromLibrary(crosswordId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/crosswords/delete`, {
      id: crosswordId,
    });
  }
}
