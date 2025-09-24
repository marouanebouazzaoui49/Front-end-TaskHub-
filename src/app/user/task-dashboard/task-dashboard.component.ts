import { Component, OnInit } from '@angular/core';
import { TaskService, Task } from '../../services/task.service';
import { UsersService } from '../../services/user.service';
import { ProjectService, Project } from '../../services/project.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-task-dashboard',
  templateUrl: './task-dashboard.component.html',
  styleUrls: ['./task-dashboard.component.css']
})
export class TaskDashboardComponent implements OnInit {

  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  projects: Project[] = [];

  loading = true;
  errorMessage = '';

  currentUserId?: number;
  currentUsername?: string;

  // Map dynamique : projectId -> projectName
  projectMap: { [key: number]: string } = {};

  // 🔹 Filtres
  filterProjectId: string = '';
  filterStatus: string = '';
  filterPriority: string = '';
  filterDate: string = '';
  searchQuery: string = '';

  constructor(
    private taskService: TaskService,
    private usersService: UsersService,
    private projectService: ProjectService
  ) {}

  ngOnInit() {
    const raw = localStorage.getItem('currentUser');
    if (raw) {
      try {
        const me = JSON.parse(raw);
        this.currentUserId = me?.id != null ? Number(me.id) : undefined;
        this.currentUsername = me?.username;
      } catch { }
    }

    this.projectService.getProjects().subscribe({
      next: (projects: Project[]) => {
        this.projects = projects;
        projects.forEach(p => this.projectMap[p.id] = p.name);
        this.loadCurrentUserAndTasks();
      },
      error: (err) => {
        console.error('Impossible de charger les projets :', err);
        this.loadCurrentUserAndTasks(); // fallback
      }
    });
  }

  private loadCurrentUserAndTasks() {
    if (!this.currentUserId) {
      this.usersService.getCurrentUser().subscribe({
        next: (me: any) => {
          this.currentUserId = me?.id != null ? Number(me.id) : undefined;
          this.currentUsername = me?.username;
          localStorage.setItem('currentUser', JSON.stringify(me));
          this.fetchTasks();
        },
        error: () => this.fetchTasks()
      });
    } else {
      this.fetchTasks();
    }
  }

  fetchTasks() {
    this.loading = true;
    this.taskService.getTasks().subscribe({
      next: (data) => {
        this.tasks = data;
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur API :', err);
        this.errorMessage = 'Impossible de charger les tâches';
        this.loading = false;
      }
    });
  }

  // 🔹 Appliquer tous les filtres
  applyFilter() {
    let temp = [...this.tasks];

    // Filtrer par utilisateur connecté
    if (this.currentUserId != null || this.currentUsername) {
      const uid = this.currentUserId;
      const uname = this.currentUsername;
      temp = temp.filter((t: any) => {
        const aid = t.assigneeId ?? t.assignee?.id ?? t.user?.id;
        const ausername = t.assignee?.username ?? t.user?.username;
        const byId = uid != null && Number(aid) === uid;
        const byUsername = uname && ausername && String(ausername) === String(uname);
        return byId || byUsername;
      });
    }

    // 🔸 Filtre projet
    if (this.filterProjectId) {
      temp = temp.filter(t => t.projectId === Number(this.filterProjectId));
    }

    // 🔸 Filtre statut
    if (this.filterStatus) {
      temp = temp.filter(t => t.status?.toLowerCase() === this.filterStatus.toLowerCase());
    }

    // 🔸 Filtre priorité
    if (this.filterPriority) {
      temp = temp.filter(t => t.priority?.toLowerCase() === this.filterPriority.toLowerCase());
    }

    // 🔸 Filtre date (ici par "dueDate")
    if (this.filterDate) {
      temp = temp.filter(t => t.dueDate?.startsWith(this.filterDate));
    }

    // 🔸 Recherche globale
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      temp = temp.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        (this.getProjectName(t)?.toLowerCase().includes(q))
      );
    }

    this.filteredTasks = temp;
  }

  get progressPercentage(): number {
    const total = this.filteredTasks.length;
    const done = this.filteredTasks.filter((t: any) => t.status === 'DONE').length;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }

  get completedTasks(): Task[] {
    return this.filteredTasks.filter((t: any) => t.status === 'DONE');
  }

  // 🔹 Changement de statut avec SweetAlert
async onStatusChange(task: any) {
  // ✅ Directement appliquer la mise à jour sans Swal de confirmation
  if (task.status === 'DONE' && !task.completedAt) {
    task.completedAt = new Date().toISOString(); // ajouter date de complétion
  }

  this.taskService.updateTaskStatus(task.id, task.status).subscribe({
    next: () => {
      this.applyFilter();

      // ✅ Swal stylé avec bouton orange
      Swal.fire({
        icon: 'success',
        title: '✅ Task Updated',
        text: `Status changed to ${task.status}`,
        confirmButtonText: 'OK',
        confirmButtonColor: '#f97316', // 🔥 bouton orange
        background: '#fff7ed',
        color: '#7c2d12',
        timer: 2500,
        timerProgressBar: true,
        showClass: {
          popup: 'animate__animated animate__fadeInDown'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutUp'
        }
      });
    },
    error: (err) => {
      console.error('Erreur maj statut', err);

      Swal.fire({
        icon: 'error',
        title: '❌ Update Failed',
        text: 'Impossible to update task status',
        confirmButtonColor: '#dc2626',
        background: '#fff1f2',
        color: '#7f1d1d'
      });
    }
  });
}


  getProjectName(task: any): string {
    if (!task || !task.projectId) return 'Projet inconnu';
    return this.projectMap[task.projectId] ?? 'Projet inconnu';
  }
// 🔹 Projet filtré selon les tâches assignées à l'utilisateur courant
get userAssignedProjects(): Project[] {
  if (!this.currentUserId) return [];
  
  // Récupérer uniquement les projectId où l'utilisateur a des tâches assignées
  const projectIds = new Set(
    this.tasks
      .filter(t => t.assigneeId === this.currentUserId) // <-- assigneeId seulement
      .map(t => t.projectId)
      .filter(Boolean)
  );

  return this.projects.filter(p => projectIds.has(p.id));
}

}
