import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class IsAdminService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  isAdmin(): Observable<boolean> {
    return this.getUserId().pipe(
      map(response => response.userId === 1)
    );
  }

  getUserId(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/crosswords/user`);
  }
}
