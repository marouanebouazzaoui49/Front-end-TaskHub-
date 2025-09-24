import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { forkJoin } from 'rxjs';
import * as AOS from 'aos';

declare var bootstrap: any; // Permet d'utiliser Bootstrap Modal en TS

// --- Interfaces ---
interface Task {
  id: number;
  title: string;
  projectId: number;
  assigneeId?: number;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  taskCount?: number;
  completedTaskCount?: number;
  completionPercentage?: number;
}

interface User {
  id: number;
  fullName: string;
}

interface DashboardStats {
  totalTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  activeProjects: number;
  completedProjects: number;
  topAssignee: { name: string; count: number };
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  public projects: Project[] = [];
  public filteredProjects: Project[] = [];
  public tasks: Task[] = [];
  public users: User[] = [];

  public stats: DashboardStats = {
    totalTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    activeProjects: 0,
    completedProjects: 0,
    topAssignee: { name: 'N/A', count: 0 },
  };

  public loading: boolean = true;
  public error: string | null = null;

  public filterStatus: string = 'ALL';
  public filterPriority: 'ALL' | 'LOW' | 'MEDIUM' | 'HIGH' = 'ALL';
  public filterUserId: number | 'ALL' = 'ALL';
  public searchQuery: string = '';

  // --- Modal Data ---
  public selectedProject: Project | null = null;
  public projectTasks: Task[] = [];
  public assignedMembers: { name: string; taskCount: number }[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }
  ngAfterViewInit() {
    AOS.init({
      duration: 800, // durée de l'animation
      easing: 'ease-in-out',
      once: true,    // l'animation ne se joue qu'une fois
    });
  }

  loadData(): void {
    this.loading = true;
    forkJoin({
      projects: this.api.getProjects(),
      tasks: this.api.getTasks(),
      users: this.api.getUsers(),
    }).subscribe({
      next: ({ projects, tasks, users }) => {
        this.tasks = tasks;
        this.users = users;
        this.projects = this.processProjectsWithTasks(projects, tasks);
        this.calculateGlobalStats(this.projects, tasks, users);
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
        this.error = 'Could not load dashboard data. Please try again later.';
        this.loading = false;
      },
    });
  }

  processProjectsWithTasks(projects: Project[], tasks: Task[]): Project[] {
    return projects.map(project => {
      const projectTasks = tasks.filter(task => task.projectId === project.id);
      const completedTasks = projectTasks.filter(task => task.status === 'DONE').length;
      const totalTasks = projectTasks.length;
      const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        ...project,
        taskCount: totalTasks,
        completedTaskCount: completedTasks,
        completionPercentage,
      };
    });
  }

  calculateGlobalStats(projects: Project[], tasks: Task[], users: User[]): void {
    const now = new Date();
    this.stats.totalTasks = tasks.length;
    this.stats.inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    this.stats.overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE').length;
    this.stats.activeProjects = projects.filter(p => p.status === 'ACTIVE').length;
    this.stats.completedProjects = projects.filter(p => p.status === 'COMPLETED').length;
    this.stats.topAssignee = this.calculateTopAssignee(tasks, users);
  }

  calculateTopAssignee(tasks: Task[], users: User[]): { name: string; count: number } {
    if (!tasks.length || !users.length) return { name: 'N/A', count: 0 };

    const taskCounts: { [key: number]: number } = {};
    tasks.forEach(task => {
      if (task.assigneeId) taskCounts[task.assigneeId] = (taskCounts[task.assigneeId] || 0) + 1;
    });

    let topAssigneeId: number | null = null;
    let maxTasks = 0;
    for (const userId in taskCounts) {
      if (taskCounts[userId] > maxTasks) {
        maxTasks = taskCounts[userId];
        topAssigneeId = Number(userId);
      }
    }

    if (topAssigneeId) {
      const topUser = users.find(u => u.id === topAssigneeId);
      return { name: topUser?.fullName || 'Unknown User', count: maxTasks };
    }
    return { name: 'N/A', count: 0 };
  }

  applyFilters(): void {
    let tempProjects = [...this.projects];

    if (this.filterPriority !== 'ALL' || this.filterUserId !== 'ALL' || ['TODO', 'IN_PROGRESS', 'DONE'].includes(this.filterStatus)) {
      const relevantProjectIds = new Set<number>();
      this.tasks
        .filter(task =>
          (this.filterPriority === 'ALL' || task.priority === this.filterPriority) &&
          (this.filterUserId === 'ALL' || task.assigneeId === this.filterUserId) &&
          (!['TODO', 'IN_PROGRESS', 'DONE'].includes(this.filterStatus) || task.status === this.filterStatus)
        )
        .forEach(task => relevantProjectIds.add(task.projectId));

      tempProjects = tempProjects.filter(project => relevantProjectIds.has(project.id));
    }

    tempProjects = tempProjects.filter(project => {
      const statusFilterMatch = this.filterStatus === 'ALL' || !['PLANNED', 'ACTIVE', 'COMPLETED', 'ARCHIVED'].includes(this.filterStatus) || project.status === this.filterStatus;
      const searchFilterMatch = !this.searchQuery ||
        project.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(this.searchQuery.toLowerCase());

      return statusFilterMatch && searchFilterMatch;
    });

    this.filteredProjects = tempProjects;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  // --- Ouvrir le modal ---
  openProjectModal(project: Project): void {
    this.selectedProject = project;
    this.projectTasks = this.tasks.filter(t => t.projectId === project.id);

    const memberMap: { [key: number]: number } = {};
    this.projectTasks.forEach(task => {
      if (task.assigneeId) {
        memberMap[task.assigneeId] = (memberMap[task.assigneeId] || 0) + 1;
      }
    });

    this.assignedMembers = Object.entries(memberMap).map(([userId, count]) => {
      const user = this.users.find(u => u.id === Number(userId));
      return { name: user ? user.fullName : 'Unknown', taskCount: count };
    });

    const modalElement = document.getElementById('projectModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }
}
