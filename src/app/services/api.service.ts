import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task } from './task.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private API_URL = 'http://localhost:8081/api'; // Backend sur port 8081

  constructor(private http: HttpClient) { }

 
  // 🔹 Authentification
  login(data: { email: string; password: string }): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.API_URL}/auth/login`, data);
  }

  signup(data: { fullName: string; email: string; password: string }): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(`${this.API_URL}/auth/signup`, data, { headers });
  }
   getAllTasks(): Observable<Task[]> {
      return this.http.get<Task[]>(this.API_URL + '/tasks'  );
    }

  // 🔹 Profil utilisateur
 getUserProfile() {
  const token = localStorage.getItem('token');
  return this.http.get('/api/users/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
}

  updateUserProfile(user: any): Observable<any> {
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    return this.http.put(`${this.API_URL}/users/me`, user, { headers });
  }

  // 🔹 Projects
 getProjects(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/projects`);
  }
addProject(project: any): Observable<any> {
  console.log("Données envoyées:", project); // <-- vérifie ça
  return this.http.post(`${this.API_URL}/projects`, project, {
    headers: { 'Content-Type': 'application/json' }
  });
}

  updateProject(id: number, project: any): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/projects/${id}`, project);
  }

  deleteProject(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/projects/${id}`);
  }
 // --- Utilisateurs ---
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/users`);
  }

  // 🔹 Projects
  // getProjects(): Observable<any> {
  //   const token = localStorage.getItem('token') || '';
  //   const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  //   return this.http.get(`${this.API_URL}/projects`, { headers });
  // }

  // addProject(project: any): Observable<any> {
  //   const token = localStorage.getItem('token') || '';
  //   const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  //   return this.http.post(`${this.API_URL}/projects`, project, { headers });
  // }

  // 🔹 Tasks
 // ===================== Tasks =====================

  getTasks(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/tasks`);
  }

  getTaskById(id: number): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/tasks/${id}`);
  }

  addTask(task: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/tasks`, task);
  }

  updateTask(id: number, task: any): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/tasks/${id}`, task);
  }

  deleteTask(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/tasks/${id}`);
  }
}
