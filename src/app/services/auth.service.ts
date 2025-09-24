// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:8081/api/auth';
  private currentUserSubject = new BehaviorSubject<any | null>(this.getUser()); // 👈 garde le user en mémoire
  currentUser$ = this.currentUserSubject.asObservable(); // 👈 observable pour les composants

  constructor(private http: HttpClient) {}

  signup(user: any): Observable<HttpResponse<any>> {
    return this.http.post<any>(`${this.baseUrl}/signup`, user, { observe: 'response' });
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, credentials);
  }

  setToken(token: string) {
    localStorage.setItem('token', token);
    const user = this.decodeToken(token);
    this.currentUserSubject.next(user); // 👈 informe les composants qu'un user est connecté
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  logout() {
    localStorage.removeItem('token');
    this.currentUserSubject.next(null); // 👈 informe que user est déconnecté
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUser(): any | null {
    const token = this.getToken();
    return token ? this.decodeToken(token) : null;
  }

  private decodeToken(token: string): any | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        username: payload.sub,
        email: payload.email,
        roles: payload.roles || []
      };
    } catch (e) {
      console.error('Invalid token', e);
      return null;
    }
  }
}
