// auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CheckTokenService {
  private authStatus = new BehaviorSubject<boolean>(this.hasToken());

  constructor() {}

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  get isAuthenticated(): Observable<boolean> {
    return this.authStatus.asObservable();
  }

  login(): void {
    this.authStatus.next(true);
  }

  logout(): void {
    this.authStatus.next(false);
  }
}
