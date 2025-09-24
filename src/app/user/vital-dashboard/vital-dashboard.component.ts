import { Component, OnInit } from '@angular/core';
import { TaskService, Task } from '../../services/task.service';
import { UsersService, User } from '../../services/user.service';
import { CommentService, Comment } from '../../services/comment.service';
import { ProjectService, Project } from '../../services/project.service';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-vital-dashboard',
  templateUrl: './vital-dashboard.component.html',
  styleUrls: ['./vital-dashboard.component.css']
})
export class VitalDashboardComponent implements OnInit {
  vitalTasks: Task[] = [];
  filteredVitalTasks: Task[] = [];
  allProjects: Project[] = [];
  projectsForFilter: Project[] = [];
  comments: { [key: number]: Comment[] } = {};
  newComment: { [key: number]: string } = {};
  currentUser?: User;
  userMap: { [key: number]: string } = {};

  loading = true;
  errorMessage: string | null = null;

  // --- FILTERS ---
  selectedProjectId: number | '' = '';
  selectedPriority: string = '';
  selectedStatus: string = '';
  searchText: string = '';
  selectedStartDate: string = '';
  selectedDueDate: string = '';

  priorities = ['LOW', 'MEDIUM', 'HIGH'];
  statuses = ['TODO', 'IN_PROGRESS', 'DONE'];
  // --- END FILTERS ---

  constructor(
    private taskService: TaskService,
    private usersService: UsersService,
    private projectService: ProjectService,
    private commentService: CommentService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.loading = true;
    this.usersService.getCurrentUser().subscribe({
      next: (me: User) => {
        this.currentUser = me;
        if (me.id) this.userMap[me.id] = me.fullName;

        forkJoin({
          users: this.usersService.getAllUsers(),
          projects: this.projectService.getProjects(),
          tasks: this.taskService.getVitalTasks()
        }).subscribe({
          next: (results) => {
            results.users.forEach(u => { if (u.id) this.userMap[u.id] = u.fullName; });
            this.allProjects = results.projects;
            this.vitalTasks = results.tasks.filter(t => t.assigneeId === this.currentUser?.id);

            const relevantProjectIds = new Set(this.vitalTasks.map(task => task.projectId));
            this.projectsForFilter = this.allProjects.filter(project => relevantProjectIds.has(project.id));

            this.vitalTasks.forEach(t => this.loadComments(t.id!));
            
            this.applyFilters();
            this.loading = false;
          },
          error: (err) => this.handleError(err)
        });
      },
      error: (err) => this.handleError(err)
    });
  }
  
  private handleError(err: any): void {
      console.error(err);
      this.errorMessage = 'Error loading page data.';
      this.loading = false;
  }

  applyFilters(): void {
    let filtered = [...this.vitalTasks];

    // FIX: Convert selectedProjectId to a number for correct comparison.
    if (this.selectedProjectId) {
      filtered = filtered.filter(task => task.projectId === Number(this.selectedProjectId));
    }

    if (this.selectedPriority) {
      filtered = filtered.filter(task => task.priority === this.selectedPriority);
    }
    if (this.selectedStatus) {
      filtered = filtered.filter(task => task.status === this.selectedStatus);
    }
    if (this.selectedStartDate) {
      filtered = filtered.filter(task => task.createdAt && task.createdAt.split('T')[0] >= this.selectedStartDate);
    }
    if (this.selectedDueDate) {
      filtered = filtered.filter(task => task.dueDate && task.dueDate.split('T')[0] <= this.selectedDueDate);
    }
    if (this.searchText) {
      const searchTextLower = this.searchText.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTextLower) ||
        (task.description && task.description.toLowerCase().includes(searchTextLower))
      );
    }
    this.filteredVitalTasks = filtered;
  }

  onStatusChange(task: Task) {
    if (task.status === 'DONE' && !task.completedAt) {
      task.completedAt = new Date().toISOString();
    }

    this.taskService.updateTaskStatus(task.id!, task.status).subscribe({
      next: () => {
        this.applyFilters();
        Swal.fire({
          icon: 'success',
          title: 'Status Updated!',
          text: `Task status is now "${task.status}"`,
          confirmButtonText: 'OK',
          confirmButtonColor: '#f97316',
          timer: 2500,
        });
      },
      error: (err) => {
        console.error('Error updating status', err);
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: 'Could not update the task status.',
          confirmButtonColor: '#dc2626',
        });
      }
    });
  }

  getProjectName(task: Task): string {
    const project = this.allProjects.find(p => p.id === task.projectId);
    return project ? project.name : 'Unknown Project';
  }

  loadComments(taskId: number): void {
    this.commentService.getCommentsByTask(taskId).subscribe({
      next: (comments: Comment[]) => { this.comments[taskId] = comments; },
      error: (err: any) => console.error('Error loading comments', err)
    });
  }

  getCommentsForTask(taskId: number): Comment[] {
    return this.comments[taskId] || [];
  }

  addComment(taskId: number): void {
    const content = this.newComment[taskId]?.trim();
    if (!content || !this.currentUser) return;
    this.commentService.addComment({ taskId, authorId: this.currentUser.id!, content })
      .subscribe((comment: Comment) => {
        this.comments[taskId].push(comment);
        this.newComment[taskId] = '';
      });
  }

  deleteComment(taskId: number, commentId: number): void {
    this.commentService.deleteComment(commentId).subscribe(() => {
      this.comments[taskId] = this.comments[taskId].filter(c => c.id !== commentId);
    });
  }

  getAuthorName(userId?: number) { return userId ? this.userMap[userId] || 'Unknown' : 'Unknown'; }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const datePart = d.toLocaleDateString();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${datePart} ${hours}:${minutes}`;
  }
}