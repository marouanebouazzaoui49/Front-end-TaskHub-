import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { UsersService, User } from '../../services/user.service';
import Swal from 'sweetalert2';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { CommentService, Comment } from '../../services/comment.service';
import { ProjectService } from '../../services/project.service';

interface Task {
  id?: number;
  title: string;
  description: string;
  dueDate?: string;
  priority: string;
  status: string;
  projectId: number | null;
  assigneeId: number | null;
  vital: boolean;
}

@Component({
  selector: 'app-task',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css']
})
export class TaskComponent implements OnInit {

  tasks: Task[] = [];
  projects: any[] = [];
  users: User[] = [];
  userMap: { [key: number]: string } = {};

  get normalUsers(): User[] {
    return this.users.filter(u => u.role === 'ROLE_USER');
  }

  // --- Filtres ---
  searchTerm: string = '';
  filterProject: number | null = null;
  filterStatus: string | null = null;
  filterPriority: string | null = null;
  filterVital: string = 'all'; // 'all', 'true', 'false'

  taskModalTitle: string = 'Add New Task';
  currentTask: Task = this.resetTask();
  isEditing: boolean = false;

  comments: { [taskId: number]: Comment[] } = {};
  newComment: { [taskId: number]: string } = {};
  currentUser: User | null = null;

  constructor(
    private userService: UsersService,
    private api: ApiService,
    private commentService: CommentService,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser(() => {
      this.loadUsers();
      this.loadProjects();
      this.loadTasks();
    });
  }

  // --- Chargement utilisateur courant ---
  loadCurrentUser(callback?: () => void) {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
      if (callback) callback();
    } else {
      this.userService.getCurrentUser().subscribe({
        next: user => {
          this.currentUser = user;
          if (callback) callback();
        },
        error: err => {
          console.error('Error loading current user', err);
          if (callback) callback();
        }
      });
    }
  }

  // --- Chargement données ---
  loadUsers() {
    this.api.getUsers().subscribe({
      next: data => {
        this.users = data;
        this.userMap = {};
        this.users.forEach(user => this.userMap[user.id!] = user.fullName);
      },
      error: err => console.error(err)
    });
  }

  loadProjects() {
    this.api.getProjects().subscribe({
      next: data => this.projects = data,
      error: err => console.error(err)
    });
  }

  loadTasks() {
    this.api.getTasks().subscribe({
      next: data => {
        this.tasks = data;
        this.tasks.forEach(task => this.loadComments(task.id!));
      },
      error: err => console.error(err)
    });
  }

  // --- Tâches filtrées ---
  get filteredTasks(): Task[] {
    return this.tasks.filter(task => {
      const matchesSearch = this.searchTerm
        ? task.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          (this.projects.find(p => p.id === task.projectId)?.name.toLowerCase().includes(this.searchTerm.toLowerCase()))
        : true;
      const matchesProject = this.filterProject ? task.projectId === this.filterProject : true;
      const matchesStatus = this.filterStatus ? task.status === this.filterStatus : true;
      const matchesPriority = this.filterPriority ? task.priority === this.filterPriority : true;
      const vitalValue = this.filterVital === 'all' ? null : this.filterVital === 'true';
      const matchesVital = vitalValue !== null ? task.vital === vitalValue : true;
      return matchesSearch && matchesProject && matchesStatus && matchesPriority && matchesVital;
    });
  }

  getTasksForColumn(projectId: number, status: string): Task[] {
    return this.filteredTasks.filter(task => task.projectId === projectId && task.status === status);
  }

  projectHasVisibleTasks(projectId: number): boolean {
    return this.filteredTasks.some(task => task.projectId === projectId);
  }

  // --- Modales ---
  openAddModal() {
    this.taskModalTitle = 'Add New Task';
    this.currentTask = this.resetTask();
    this.isEditing = false;
    new (window as any).bootstrap.Modal(document.getElementById('taskModal')).show();
  }

  openEditModal(task: Task) {
    this.taskModalTitle = 'Edit Task';
    this.currentTask = {
      ...task,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
    };
    this.isEditing = true;
    new (window as any).bootstrap.Modal(document.getElementById('taskModal')).show();
  }

  saveTask() {
    if (!this.currentTask.title || !this.currentTask.projectId || !this.currentTask.assigneeId) {
      Swal.fire('⚠️ Required fields', 'Title, Project, and Assignee are required', 'warning');
      return;
    }

    const taskToSend = {
      ...this.currentTask,
      projectId: Number(this.currentTask.projectId),
      assigneeId: Number(this.currentTask.assigneeId),
      dueDate: this.currentTask.dueDate ? new Date(this.currentTask.dueDate).toISOString() : null
    };

    const operation = this.isEditing && this.currentTask.id
      ? this.api.updateTask(this.currentTask.id, taskToSend)
      : this.api.addTask(taskToSend);

    operation.subscribe(() => {
      this.loadTasks();
      const msg = this.isEditing ? 'Task Updated' : 'Task Added';
      Swal.fire(`✅ ${msg}`, `${msg} successfully`, 'success');
    });
  }

  deleteTask(id: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then(result => {
      if (result.isConfirmed) {
        this.api.deleteTask(id).subscribe(() => {
          this.loadTasks();
          Swal.fire('✅ Deleted', 'Task deleted successfully', 'success');
        });
      }
    });
  }

  resetTask(): Task {
    return {
      title: '',
      description: '',
      dueDate: '',
      priority: 'MEDIUM',
      status: 'TODO',
      projectId: null,
      assigneeId: null,
      vital: false
    };
  }

  // --- Helpers ---
  getAssigneeName(id: number | null) {
    return this.users.find(u => u.id === id)?.fullName || 'Unknown';
  }

  getAuthorName(userId?: number) {
    return userId ? this.userMap[userId] || 'Unknown' : 'Unknown';
  }

  getPriorityClass(priority: string) {
    switch (priority) {
      case 'HIGH': return 'bg-danger';
      case 'MEDIUM': return 'bg-warning text-dark';
      case 'LOW': return 'bg-info text-dark';
      default: return 'bg-secondary';
    }
  }

  getStatusClass(status: string) {
    switch (status) {
      case 'TODO': return 'bg-todo';
      case 'IN_PROGRESS': return 'bg-inprogress';
      case 'DONE': return 'bg-done';
      default: return 'bg-light';
    }
  }

  // --- Commentaires ---
  loadComments(taskId: number) {
    this.commentService.getCommentsByTask(taskId).subscribe({
      next: comments => this.comments[taskId] = comments,
      error: err => console.error('Error loading comments', err)
    });
  }

  getCommentsForTask(taskId: number): Comment[] {
    return this.comments[taskId] || [];
  }

  addComment(taskId: number) {
    const content = this.newComment[taskId]?.trim();
    if (!content || !this.currentUser) return;

    this.commentService.addComment({
      taskId,
      authorId: this.currentUser.id!,
      content
    }).subscribe(comment => {
      this.comments[taskId] = this.comments[taskId] || [];
      this.comments[taskId].push(comment);
      this.newComment[taskId] = '';
    });
  }

  deleteComment(taskId: number, commentId: number) {
    this.commentService.deleteComment(commentId).subscribe(() => {
      this.comments[taskId] = this.comments[taskId].filter(c => c.id !== commentId);
    });
  }

  // --- Drag & Drop ---
drop(event: CdkDragDrop<Task[]>) {
  if (event.previousContainer === event.container) {
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
  } else {
    const task = event.previousContainer.data[event.previousIndex];
    const oldStatus = task.status;
    const newStatus = event.container.id.split('-')[1];
    task.status = newStatus;

    this.api.updateTask(task.id!, task).subscribe({
      next: () => {
        const taskIndex = this.tasks.findIndex(t => t.id === task.id);
        if (taskIndex > -1) this.tasks[taskIndex].status = newStatus;

        Swal.fire({
          title: `<span style="color: orange; font-weight: bold;">Task Status Updated</span>`,
          html: `
            <div style="text-align: left;">
              <p><strong>Task:</strong> ${task.title}</p>
              <p><strong>From:</strong> <span style="color: #FF8C42;">${oldStatus.replace('_',' ')}</span></p>
              <p><strong>To:</strong> <span style="color: #FF8C42;">${newStatus.replace('_',' ')}</span></p>
            </div>
          `,
icon: 'success',
          background: '#fff3e0',
          confirmButtonColor: '#FF8C42',
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          customClass: {
            popup: 'swal-task-popup'
          }
        });
      },
      error: () => {
        task.status = oldStatus;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to update task status',
          confirmButtonColor: '#FF8C42'
        });
      }
    });


      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }
}
