import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { map } from 'rxjs/operators';

interface Crossword {
  id: string;
  title: string;
}

interface CrosswordResponse {
  crossword_id: number;
  title: string;
  created_at: string;
  content: object;
}

@Injectable({
  providedIn: 'root',
})
export class CrosswordsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUserId(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/crosswords/user`);
  }

  getCrosswords(): Observable<Crossword[]> {
    return this.http
      .get<CrosswordResponse[]>(`${this.apiUrl}/crosswords/library`)
      .pipe(
        map((data: CrosswordResponse[]) =>
          data.map((crossword) => ({
            id: crossword.crossword_id.toString(),
            title: crossword.title,
          }))
        )
      );
  }

  getUserCrosswords(): Observable<Crossword[]> {
    return this.http.get<any>(`${this.apiUrl}/crosswords/user/library`).pipe(
      map((data: any[]) =>
        data.map((crossword) => ({
          id: crossword.crossword_id.toString(),
          title: crossword.title,
        }))
      )
    );
  }

  addCrosswordToLibrary(crosswordId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/crosswords/user/library`, {
      id: crosswordId,
    });
  }

  deleteCrosswordFromLibrary(crosswordId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/crosswords/user/library`, {
      body: { id: crosswordId },
    });
  }

  deleteCrosswordFromPublicLibrary(crosswordId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/crosswords/library`, {
      body: { id: crosswordId },
    });
  }
}
