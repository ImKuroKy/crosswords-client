import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { map } from 'rxjs/operators';

interface Crossword {
  id: string;
  title: string;
}

interface UserProgress {
  grid: string[][];
  // возможно, ещё какие-то поля
}

interface CrosswordResponse {
  crossword_id: number;
  title: string;
  created_at: string;
  content: object;
}

interface CrosswordData {
  title: string;
  width: number;
  height: number;
  hints: number;
  fillMethod: string;
  dictionary: string;
  grid: string[][];
  words: {
    word: string;
    definition: string;
    length: number;
    row: number;
    col: number;
    direction: string;
    cells: { row: number; col: number }[];
  }[];
  clues: {
    across: {
      number: number;
      clue: string;
      cells: { row: number; col: number }[];
    }[];
    down: {
      number: number;
      clue: string;
      cells: { row: number; col: number }[];
    }[];
  };
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
    return this.http.get<any[]>(`${this.apiUrl}/crosswords/user/library`).pipe(
      map((data: any[]) =>
        data.map((crossword) => ({
          id: crossword.id.toString(), // Преобразуем id в строку
          title: crossword.title, // Оставляем title как есть
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

  // Метод для отправки данных кроссворда на сервер
  saveCrossword(crosswordData: CrosswordData): Observable<any> {
    return this.http.post(`${this.apiUrl}/crosswords/add`, crosswordData);
  }

  saveCrosswordProgress(
    crosswordId: string,
    userProgress: UserProgress
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/crosswords/save/${crosswordId}`,
      userProgress
    );
  }

  getCrosswordById(crosswordId: string) {
    return this.http.get<any>(`${this.apiUrl}/crosswords/play/${crosswordId}`);
  }
  
  getPublicCrosswordById(crosswordId: string) {
    return this.http.get<any>(`${this.apiUrl}/crosswords/edit/${crosswordId}`);
  }

  getUserCrosswordProgress(crosswordId: string) {
    return this.http.get<any>(`${this.apiUrl}/crosswords/get/save/${crosswordId}`);
  }

  updateCrossword(
    crosswordId: string,
    crosswordData: {
      title: string;
      width: number;
      height: number;
      hints: number;
      fillMethod: string;
      dictionary: string;
      grid: string[][];
      words: {
        word: string;
        definition: string;
        length: number;
        row: number;
        col: number;
        direction: string;
        cells: { row: number; col: number }[];
      }[];
    }
  ) {
    return this.http.post(
      `${this.apiUrl}/crosswords/edit/public/${crosswordId}`,
      crosswordData
    );
  }
}
