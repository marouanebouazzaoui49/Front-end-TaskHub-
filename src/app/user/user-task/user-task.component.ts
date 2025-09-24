import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router'; // **ADDED** for logout navigation
import { TaskService, Task } from '../../services/task.service';
import { UsersService, User } from '../../services/user.service';
import { CommentService, Comment } from '../../services/comment.service';
import { ProjectService, Project } from '../../services/project.service';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-task',
  templateUrl: './user-task.component.html',
  styleUrls: ['./user-task.component.css']
})
export class UserTaskComponent implements OnInit {
  // --- Component State ---
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  tasksByStatus: { [status: string]: Task[] } = { TODO: [], IN_PROGRESS: [], DONE: [] };
  comments: { [key: number]: Comment[] } = {};
  newComment: { [key: number]: string } = {};
  currentUser?: User;
  userMap: { [key: number]: string } = {};
  projectMap: { [key: number]: string } = {};
  allProjects: Project[] = [];
  projectsForFilter: Project[] = [];
  loading = true;
  dragOverStatus: string | null = null;
  userId: number;

  // **ADDED: Properties for Sidebar State**
  isSidebarCollapsed = false;
  isMobileSidebarOpen = false;

  // --- Filter Data & State ---
  statuses = ['TODO', 'IN_PROGRESS', 'DONE'];
  priorities = ['LOW', 'MEDIUM', 'HIGH'];
  selectedStatus: string = '';
  selectedPriority: string = '';
  searchText: string = '';
  selectedStartDate: string = '';
  selectedDueDate: string = '';
  selectedVital: boolean | '' = '';
  selectedProjectId: number | '' = '';

  constructor(
    private taskService: TaskService,
    private usersService: UsersService,
    private commentService: CommentService,
    private projectService: ProjectService,
    private router: Router // **ADDED:** Inject Router for navigation
  ) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.userId = user.id;
  }

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  // **ADDED: Method to toggle sidebar for mobile**
  toggleSidebar(): void {
    this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
  }

  // **ADDED: Method for user logout**
  logout(): void {
    // Implement your actual logout logic here (e.g., clearing localStorage, calling an auth service)
    console.log('Logging out...');
    localStorage.removeItem('user'); // Example: clear user data
    this.router.navigate(['/login']); // Example: navigate to login page
  }

  // ==== Data Loading ====
  loadCurrentUser() {
    this.usersService.getCurrentUser().subscribe({
      next: (me: User) => {
        this.currentUser = me;
        if (me.id) this.userMap[me.id] = me.fullName;
        this.loadAllUsers();
        this.loadProjects();
      },
      error: () => this.fetchTasks()
    });
  }

  loadAllUsers() {
    this.usersService.getAllUsers().subscribe(users =>
      users.forEach(u => { if (u.id) this.userMap[u.id] = u.fullName; })
    );
  }

  loadProjects() {
    this.projectService.getProjects().subscribe(projects => {
      this.allProjects = projects;
      this.fetchTasks();
    }, err => this.fetchTasks());
  }

  fetchTasks() {
    if (!this.currentUser) return;
    this.loading = true;
    this.taskService.getTasks().subscribe({
      next: (tasks: Task[]) => {
        this.tasks = tasks.filter(t => t.assigneeId === this.currentUser?.id);
        this.tasks.forEach(t => this.loadComments(t.id!));

        const relevantProjectIds = new Set(this.tasks.map(t => t.projectId));
        this.projectsForFilter = this.allProjects.filter(p => relevantProjectIds.has(p.id));
        this.projectsForFilter.forEach(p => { if(p.id) this.projectMap[p.id] = p.name; });

        this.filterTasks();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  loadComments(taskId: number) {
    this.commentService.getCommentsByTask(taskId).subscribe(comments => this.comments[taskId] = comments);
  }

  // ==== Comments CRUD ====
  addComment(taskId: number) {
    const content = this.newComment[taskId]?.trim();
    if (!content || !this.currentUser) return;
    this.commentService.addComment({ taskId, authorId: this.currentUser.id!, content }).subscribe(comment => {
      this.comments[taskId] = this.comments[taskId] || [];
      this.comments[taskId].push(comment);
      this.newComment[taskId] = '';
    });
  }

  deleteComment(taskId: number, commentId: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: "This comment will be deleted!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#FF7300',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.commentService.deleteComment(commentId).subscribe(() => {
          this.comments[taskId] = this.comments[taskId].filter(c => c.id !== commentId);
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Comment has been deleted.',
            confirmButtonColor: '#FF7300'
          });
        });
      }
    });
  }

  getCommentsForTask(taskId: number) { return this.comments[taskId] || []; }
  getAuthorName(userId?: number) { return userId ? this.userMap[userId] || 'Unknown' : 'Unknown'; }

  // ==== Drag & Drop ====
  drop(event: CdkDragDrop<Task[]>, newStatus: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      task.status = newStatus as 'TODO' | 'IN_PROGRESS' | 'DONE';
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      this.updateTaskStatus(task);
    }
    this.dragOverStatus = null;
  }

  onDragEnter(event: any, status: string) { this.dragOverStatus = status; }
  onDragExit(event: any, status: string) { this.dragOverStatus = null; }

  // ==== Filtering ====
  filterTasks() {
    const filtered = this.tasks.filter(t => {
      const statusCheck = this.selectedStatus ? t.status === this.selectedStatus : true;
      const priorityCheck = this.selectedPriority ? t.priority === this.selectedPriority : true;
      const textCheck = this.searchText
        ? (t.title.toLowerCase().includes(this.searchText.toLowerCase()) || (t.description && t.description.toLowerCase().includes(this.searchText.toLowerCase())))
        : true;
      const createdCheck = this.selectedStartDate ? t.createdAt.slice(0, 10) >= this.selectedStartDate : true;
      const dueDateCheck = this.selectedDueDate ? (t.dueDate ? t.dueDate.slice(0, 10) <= this.selectedDueDate : false) : true;
      const vitalCheck = this.selectedVital === '' ? true : !!t.vital === this.selectedVital;
      const projectCheck = this.selectedProjectId === '' ? true : t.projectId === Number(this.selectedProjectId);

      return statusCheck && priorityCheck && textCheck && createdCheck && dueDateCheck && vitalCheck && projectCheck;
    });

    this.filteredTasks = filtered;
    this.tasksByStatus = { TODO: [], IN_PROGRESS: [], DONE: [] };
    filtered.forEach(t => this.tasksByStatus[t.status].push(t));
  }

  // ==== Status Change with Alert ====
updateTaskStatus(task: Task) {
  const oldStatus = task.status; // ancien statut
  // Supposons que task.status a été changé dans le template
  this.taskService.updateTaskStatus(task.id!, task.status).subscribe({
    next: () => {
      Swal.fire({
        title: `<span style="color: orange; font-weight: bold;">Task Status Updated</span>`,
        html: `
          <div style="text-align: left;">
            <p><strong>Task:</strong> ${task.title}</p>
            <p><strong>From:</strong> <span style="color: #FF8C42;">${oldStatus.replace('_',' ')}</span></p>
            <p><strong>To:</strong> <span style="color: #FF8C42;">${task.status.replace('_',' ')}</span></p>
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
      this.filterTasks(); // recharge ou filtre les tâches
    },
    error: () => {
      task.status = oldStatus; // rollback
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update task status',
        confirmButtonColor: '#FF8C42'
      });
    }
  });
}

  formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const datePart = d.toLocaleDateString();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${datePart} ${hours}:${minutes}`;
  }
}