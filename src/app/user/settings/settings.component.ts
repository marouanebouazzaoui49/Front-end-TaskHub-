import { Component, OnInit } from '@angular/core';
import { UsersService, User } from '../../services/user.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  user: User = {
    id: 0,
    username: '',
    fullName: '',
    email: '',
    password: '',
    oldPassword: '', // <-- ajouté
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
      error: (err) => console.error(err)
    });
  }

  updateProfile() {
    if (!this.user.id) {
      this.errorMessage = 'ID utilisateur manquant';
      return;
    }

    // Si le password est vide, utiliser l'ancien mot de passe
    const payload: User = {
      ...this.user,
      password: this.user.password ? this.user.password : this.user.oldPassword
    };

    this.userService.updateUser(this.user.id, payload).subscribe({
      next: () => {
        this.successMessage = 'Profil mis à jour avec succès !';
        this.errorMessage = '';
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors de la mise à jour du profil';
        this.successMessage = '';
        console.error(err);
      }
    });
  }
}
