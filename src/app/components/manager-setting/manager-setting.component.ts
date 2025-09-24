import { Component, OnInit } from '@angular/core';
import { UsersService, User } from '../../services/user.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-settings',
  templateUrl: './manager-setting.component.html',
  styleUrls: ['./manager-setting.component.css']
})
export class ManagerSettingComponent implements OnInit {
  user: User = {
    id: 0,
    username: '',
    fullName: '',
    email: '',
    password: '',
    oldPassword: '',  // <-- ajouté
    role: 'ROLE_USER'
  };

  successMessage = '';
  errorMessage = '';

  constructor(private userService: UsersService) {}

  ngOnInit() {
    this.userService.getCurrentUser().subscribe({
      next: (data: any) => {
        this.user.id = data.id;
        this.user.username = data.username;
        this.user.fullName = data.fullName;
        this.user.email = data.email;
        this.user.role = data.role;
        this.user.oldPassword = data.password; // <-- conserver ancien mot de passe
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Failed to load user profile';
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: this.errorMessage
        });
      }
    });
  }

  updateProfile() {
    if (!this.user.id) {
      this.errorMessage = 'User ID is missing';
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: this.errorMessage
      });
      return;
    }

    // Si password vide, utiliser l'ancien mot de passe
    const payload: User = {
      ...this.user,
      password: this.user.password ? this.user.password : this.user.oldPassword
    };

    this.userService.updateUser(this.user.id, payload).subscribe({
      next: () => {
        this.successMessage = 'Profile updated successfully!';
        this.errorMessage = '';

        Swal.fire({
          icon: 'success',
          title: 'Profile Updated',
          text: this.successMessage,
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Error updating profile';
        this.successMessage = '';

        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: this.errorMessage
        });
      }
    });
  }
}
