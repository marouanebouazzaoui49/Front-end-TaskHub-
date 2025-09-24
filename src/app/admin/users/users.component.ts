import { Component, OnInit } from '@angular/core';
import { UsersService, User } from '../../services/user.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  selectedUser: User = { 
    id: undefined, 
    username: '', 
    fullName: '', 
    email: '', 
    password: '', 
    oldPassword: '', 
    role: 'ROLE_USER' 
  };
  isEditMode = false;
  errors: any = {};
  roles = ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER'];

  constructor(private usersService: UsersService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.usersService.getAllUsers().subscribe({
      next: (data) => this.users = data,
      error: () => Swal.fire('Error', 'Unable to load users', 'error')
    });
  }

  openAddModal() {
    this.isEditMode = false;
    this.selectedUser = { 
      id: undefined, 
      username: '', 
      fullName: '', 
      email: '', 
      password: '', 
      oldPassword: '', 
      role: 'ROLE_USER' 
    };
    this.errors = {};
  }

  openEditModal(user: User) {
    this.isEditMode = true;
    this.selectedUser = { ...user, password: '', oldPassword: user.password };
    this.errors = {};
  }

  closeModal() {
    const modal = document.getElementById('userModal');
    if (modal) {
      const modalInstance = (window as any).bootstrap.Modal.getInstance(modal);
      modalInstance?.hide();
    }
  }

  saveUser() {
    this.errors = {};

    // Front-end validation in English
    if (!this.selectedUser.username || this.selectedUser.username.length < 3 || this.selectedUser.username.length > 15) {
      this.errors.username = 'Username is required (3-15 characters)';
    }
    if (!this.selectedUser.fullName || this.selectedUser.fullName.length > 40) {
      this.errors.fullName = 'Full Name is required (max 40 characters)';
    }
    if (!this.selectedUser.email || this.selectedUser.email.length > 40 || !this.selectedUser.email.includes('@')) {
      this.errors.email = 'Please enter a valid email (e.g., user@example.com)';
    }
    if (!this.isEditMode && (!this.selectedUser.password || this.selectedUser.password.length < 6 || this.selectedUser.password.length > 20)) {
      this.errors.password = 'Password is required (6-20 characters)';
    }
    if (this.isEditMode && this.selectedUser.password && (this.selectedUser.password.length < 6 || this.selectedUser.password.length > 20)) {
      this.errors.password = 'Password must be 6-20 characters';
    }
    if (!this.selectedUser.role) {
      this.errors.role = 'Role is required';
    }

    if (Object.keys(this.errors).length > 0) return;

    if (this.isEditMode && typeof this.selectedUser.id === 'number') {
      const updatePayload: User = {
        id: this.selectedUser.id,
        username: this.selectedUser.username!,
        fullName: this.selectedUser.fullName!,
        email: this.selectedUser.email!,
        role: this.selectedUser.role!,
        password: this.selectedUser.password ? this.selectedUser.password : this.selectedUser.oldPassword!,
        oldPassword: this.selectedUser.oldPassword!,
        createdAt: this.selectedUser.createdAt || new Date().toISOString()
      };

      this.usersService.updateUser(this.selectedUser.id, updatePayload).subscribe({
        next: () => {
          this.loadUsers();
          this.closeModal();
          Swal.fire('Success', 'User successfully updated', 'success');
        },
        error: () => Swal.fire('Error', 'Unable to update user', 'error')
      });
    } else {
      const newUser: User = {
        id: undefined,
        username: this.selectedUser.username!,
        fullName: this.selectedUser.fullName!,
        email: this.selectedUser.email!,
        role: this.selectedUser.role!,
        password: this.selectedUser.password!,
        oldPassword: this.selectedUser.password!,
        createdAt: new Date().toISOString()
      };

      this.usersService.createUser(newUser).subscribe({
        next: () => {
          this.loadUsers();
          this.closeModal();
          Swal.fire('Success', 'New user added', 'success');
        },
        error: () => Swal.fire('Error', 'Unable to add user', 'error')
      });
    }
  }

  deleteUser(id: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.usersService.deleteUser(id).subscribe({
          next: () => {
            this.loadUsers();
            Swal.fire('Deleted', 'User successfully deleted', 'success');
          },
          error: () => Swal.fire('Error', 'Unable to delete user', 'error')
        });
      }
    });
  }
}
