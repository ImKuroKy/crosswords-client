import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(user: { nickname: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, user);
  }

  register(user: { nickname:string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/register`, user);
  }

  getUserProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/profile`);
  }
}
