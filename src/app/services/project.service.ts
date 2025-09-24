import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Project {
id: number;
  name: string;
  description?: string;
  status?: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  startDate?: string;
  endDate?: string;
  ownerId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  private apiUrl = 'http://localhost:8081/api/projects'; // Mets ici l'URL de ton backend

  constructor(private http: HttpClient) { }

  // Récupérer tous les projets
  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.apiUrl);
  }

  // Récupérer un projet par ID
  getProjectById(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}`);
  }

  // Créer un nouveau projet
  createProject(project: Project): Observable<Project> {
    return this.http.post<Project>(this.apiUrl, project);
  }

  // Mettre à jour un projet existant
  updateProject(id: number, project: Project): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}/${id}`, project);
  }

  // Supprimer un projet
  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
