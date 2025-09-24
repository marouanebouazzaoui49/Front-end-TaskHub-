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
  selectedUser: User = { id: undefined, username: '', fullName: '', email: '', password: '', role: 'ROLE_USER' };
  isEditMode = false;

  roles = ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_USER'];

  constructor(private usersService: UsersService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.usersService.getAllUsers().subscribe({
      next: (data) => this.users = data,
      error: () => Swal.fire('Erreur', 'Impossible to upload users', 'error')
    });
  }

  openAddModal() {
    this.isEditMode = false;
    this.selectedUser = { id: undefined, username: '', fullName: '', email: '', password: '', role: 'ROLE_USER' };
  }

  openEditModal(user: User) {
    this.isEditMode = true;
    this.selectedUser = { ...user };
  }

  saveUser() {
    if (this.isEditMode && typeof this.selectedUser.id === 'number') {
      this.usersService.updateUser(this.selectedUser.id, this.selectedUser).subscribe({
        next: () => {
          this.loadUsers();
      Swal.fire('Success', 'User successfully updated', 'success');
},
error: () => Swal.fire('Error', 'Unable to update user', 'error')
      });
    } else {
      this.usersService.createUser(this.selectedUser).subscribe({
        next: () => {
          this.loadUsers();
          Swal.fire('Success', 'New user added', 'success');
},
error: () => Swal.fire('Error', 'Unable to add user', 'error')
});
    }
  }

  deleteUser(id: number) {
    Swal.fire({
      title: 'Are you sure?',
text: 'This action is irreversible',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.usersService.deleteUser(id).subscribe({
          next: () => {
            this.loadUsers();
Swal.fire('Deleted', 'User successfully deleted', 'success');          },
          error: () => Swal.fire('Erreur', 'Impossible delete user ', 'error')
        });
      }
    });
  }
}
