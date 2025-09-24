import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { UsersService, User } from '../../services/user.service';
import Swal from 'sweetalert2';

type ProjectStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit {
  projects: any[] = [];
  users: User[] = [];
  managers: User[] = []; // uniquement les managers

  tasks: any[] = [];
  statuses: ProjectStatus[] = ['PLANNED','ACTIVE','COMPLETED','ARCHIVED'];
  selectedProject: any = null;

  newProject: any = { 
    name: '', description: '', startDate: '', endDate: '', 
    status: 'PLANNED', ownerId: null, teamMemberIds: [] 
  };
  editProject: any = null;

  // Drag & Drop
  draggedProjectId: number | null = null;

  // Filtres
  searchText: string = '';
  filterStatus: ProjectStatus | '' = '';
  filterStartDate: string = '';
  filterEndDate: string = '';

  constructor(private api: ApiService, private usersService: UsersService) {}

  ngOnInit(): void {
    // Charger les projets, users, tasks
    this.loadProjects();
    this.loadTasks();
    this.loadOwners(); // 🔹 uniquement pour owner dropdown
  }

  // 🔹 Charger uniquement les owners (managers)
  loadOwners() {
    this.usersService.getAllUsers().subscribe({
      next: (res: User[]) => {
        this.users = res; // pour getOwnerName
        this.managers = res.filter(u => u.role === 'ROLE_MANAGER');
        // Si currentUser est admin ou manager, on peut préselectionner owner
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (currentUser && currentUser.id) this.newProject.ownerId = currentUser.id;
      },
      error: err => console.error(err)
    });
  }

  // Charger toutes les tasks
  loadTasks() {
    this.api.getTasks().subscribe({
      next: data => this.tasks = data,
      error: err => console.error('Error loading tasks', err)
    });
  }

  // Utils
  getOwnerName(ownerId: number): string {
    const user = this.users.find(u => u.id === ownerId);
    return user ? user.fullName : 'Unknown';
  }

  openViewProjectModal(project: any): void {
    const projectTasks = this.tasks.filter((t: any) => t.projectId === project.id);

    const memberMap: { [key: number]: number } = {};
    projectTasks.forEach((task: any) => {
      if (task.assigneeId) memberMap[task.assigneeId] = (memberMap[task.assigneeId] || 0) + 1;
    });

    const assignedMembers = Object.entries(memberMap).map(([userId, count]) => {
      const user = this.users.find(u => u.id === +userId);
      return { name: user ? user.fullName : 'Unknown', taskCount: count };
    });

    this.selectedProject = {
      ...project,
      tasks: projectTasks,
      members: assignedMembers
    };

    const modalElement = document.getElementById('viewProjectModal');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  formatDate(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${d.getFullYear()}-${month}-${day}`;
  }

  // Load data
  loadProjects() {
    this.api.getProjects().subscribe({
      next: data => this.projects = data,
      error: err => console.error('Error loading projects', err)
    });
  }

  // Filtres combinés
  filteredProjects(status: ProjectStatus) {
    return this.projects.filter(p => 
      p.status === status &&
      (this.filterStatus === '' || p.status === this.filterStatus) &&
      (this.searchText === '' || p.name.toLowerCase().includes(this.searchText.toLowerCase())) &&
      (!this.filterStartDate || new Date(p.startDate) >= new Date(this.filterStartDate)) &&
      (!this.filterEndDate || new Date(p.endDate) <= new Date(this.filterEndDate))
    );
  }

  // Add project
  addProject() {
    if (!this.newProject.name || !this.newProject.startDate || !this.newProject.ownerId) {
      Swal.fire({ icon: 'warning', title: 'Missing Info', text: 'Name, start date and owner are required.' });
      return;
    }

    const projectToSend = {
      ...this.newProject,
      startDate: new Date(this.newProject.startDate).toISOString(),
      endDate: this.newProject.endDate ? new Date(this.newProject.endDate).toISOString() : null,
      ownerId: Number(this.newProject.ownerId),
      teamMemberIds: (this.newProject.teamMemberIds || []).map(Number)
    };

    this.api.addProject(projectToSend).subscribe({
      next: () => {
        this.loadProjects();
        this.newProject = { name: '', description: '', startDate: '', endDate: '', status: 'PLANNED', ownerId: this.newProject.ownerId, teamMemberIds: [] };
        Swal.fire({ icon: 'success', title: 'Project Added!', timer: 2000, showConfirmButton: false });
      },
      error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to add project.' })
    });
  }

  // Edit project
  startEdit(project: any) {
    this.editProject = { ...project, startDate: this.formatDate(project.startDate), endDate: this.formatDate(project.endDate) };
  }

  updateProject() {
    if (!this.editProject) return;

    const projectToSend = {
      ...this.editProject,
      startDate: this.editProject.startDate ? new Date(this.editProject.startDate).toISOString() : null,
      endDate: this.editProject.endDate ? new Date(this.editProject.endDate).toISOString() : null,
      ownerId: Number(this.editProject.ownerId),
      teamMemberIds: (this.editProject.teamMemberIds || []).map(Number)
    };

    this.api.updateProject(this.editProject.id, projectToSend).subscribe({
      next: () => { 
        this.loadProjects(); 
        this.editProject = null; 
        Swal.fire({ icon: 'success', title: 'Project Updated!', timer: 2000, showConfirmButton: false }); 
      },
      error: () => Swal.fire({ icon: 'error', title: 'Update Failed', text: 'Could not update the project.' })
    });
  }

  cancelEdit() { this.editProject = null; }

  deleteProject(id: number) {
    Swal.fire({
      title: 'Are you sure?', text: "This cannot be undone!", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#FF7300', cancelButtonColor: '#d33', confirmButtonText: 'Yes, delete it!'
    }).then(result => {
      if (result.isConfirmed) {
        this.api.deleteProject(id).subscribe({
          next: () => { 
            this.loadProjects(); 
            Swal.fire({ icon: 'success', title: 'Project Deleted!', timer: 2000, showConfirmButton: false }); 
          },
          error: () => Swal.fire({ icon: 'error', title: 'Delete Failed', text: 'Could not delete the project.' })
        });
      }
    });
  }

  // Drag & Drop
  onDragStart(event: DragEvent, projectId: number) {
    this.draggedProjectId = projectId;
    event.dataTransfer?.setData('text/plain', projectId.toString());
    event.dataTransfer?.setDragImage(new Image(), 0, 0);
  }

  onDragEnd(event: DragEvent) { this.draggedProjectId = null; }

  onDragOver(event: DragEvent) { event.preventDefault(); (event.currentTarget as HTMLElement).classList.add('drag-over'); }
  onDragLeave(event: DragEvent) { (event.currentTarget as HTMLElement).classList.remove('drag-over'); }

onDrop(event: DragEvent, newStatus: ProjectStatus) {
  event.preventDefault();
  const target = event.currentTarget as HTMLElement;
  target.classList.remove('drag-over');

  const id = event.dataTransfer?.getData('text/plain');
  if (!id) return;

  const project = this.projects.find(p => p.id === +id);
  if (!project || project.status === newStatus) return;

  const oldStatus = project.status;
  project.status = newStatus;

  const projectToSend = { 
    ...project, 
    startDate: new Date(project.startDate).toISOString(), 
    endDate: project.endDate ? new Date(project.endDate).toISOString() : null, 
    ownerId: Number(project.ownerId), 
    teamMemberIds: (project.teamMemberIds || []).map(Number) 
  };

  this.api.updateProject(project.id, projectToSend).subscribe({
    next: () => {
      this.projects = this.projects.map(p => p.id === project.id ? projectToSend : p);

      // 🔥 SweetAlert stylé orange
      Swal.fire({
        title: `<span style="color: orange; font-weight: bold;">Project Status Updated</span>`,
        html: `
          <div style="text-align: left;">
            <p><strong>Project:</strong> ${project.name}</p>
            <p><strong>From:</strong> <span style="color: #FF8C42;">${oldStatus}</span></p>
            <p><strong>To:</strong> <span style="color: #FF8C42;">${newStatus}</span></p>
          </div>
        `,
icon: 'success',        background: '#fff3e0',
        confirmButtonColor: '#FF8C42',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        customClass: { popup: 'swal-project-popup' }
      });
    },
    error: () => {
      project.status = oldStatus;
      Swal.fire({ icon: 'error', title: 'Update Failed', text: 'Could not update the project.', confirmButtonColor: '#FF8C42' });
    }
  });

  this.draggedProjectId = null;
}

}
