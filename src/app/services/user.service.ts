import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface User {
  id?: number;
  username: string;
  fullName: string;
  email: string;
  password: string;
  role: 'ROLE_ADMIN' | 'ROLE_MANAGER' | 'ROLE_USER';
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = 'http://localhost:8081/api/users';

  // 🔥 BehaviorSubject pour currentUser
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  createUser(user: User): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  updateUser(id: number, user: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user).pipe(
      tap(updatedUser => {
        // Met à jour currentUser si c’est le même
        if (this.currentUserSubject.value?.id === id) {
          this.setCurrentUser(updatedUser);
        }
      })
    );
  }
  clearCurrentUser() {
  this.currentUserSubject.next(null);
  localStorage.removeItem('currentUser');
}


  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getCurrentUser(): Observable<User> {
    const token = localStorage.getItem('token');
    return this.http.get<User>(`${this.apiUrl}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      tap(user => this.setCurrentUser(user)) // met à jour automatiquement
    );
  }

  // setter pour currentUser
  setCurrentUser(user: User) {
    this.currentUserSubject.next(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  loadCurrentUserFromStorageOrApi() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    } else {
      this.getCurrentUser().subscribe();
    }
  }
}
