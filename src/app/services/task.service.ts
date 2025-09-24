import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Task {
  id: number;
  title: string;
  description?: string;
 assigneeId: number; // attention pas assignee_id ici
  projectId: number;   // c’est le champ qui relie au projet
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  createdAt: string;
  dueDate?: string;
    reporterId: number; // correspond au user qui a créé la tâche
      completedAt?: string; // ou Date selon ton API
        vital?: boolean;   // <-- ajouter cette ligne
        

      


}

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  private apiUrl = 'http://localhost:8081/api/tasks'; // À adapter selon ton backend
  

  constructor(private http: HttpClient) { }

getVitalTasks(): Observable<Task[]> {
  return this.http.get<Task[]>(`${this.apiUrl}/vital`);
}

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.apiUrl);
  }
  updateTaskStatus(taskId: number, status: string): Observable<Task> {
  return this.http.patch<Task>(`${this.apiUrl}/${taskId}/status`, { status });
}
  getAllTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.apiUrl);
  }

  // Tâches du user connecté
  getTasksByCurrentUser(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/user`);
  }

}
