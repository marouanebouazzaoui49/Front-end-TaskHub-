// src/app/components/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls:['./login.component.css']
})
export class LoginComponent implements OnInit {

  credentials = {
    usernameOrEmail: '',
    password: ''
  };

  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
  
  }

  // Fonction login appelée depuis le formulaire
  login(): void {
    this.errorMessage = '';

    this.authService.login(this.credentials).subscribe({
      next: (response: any) => {
        // Vérifie la clé du token renvoyé par le backend
        const token = response.token || response.accessToken;
        if (!token) {
          this.errorMessage = 'Token non reçu depuis le serveur';
          return;
        }

        // Stocker le token
        this.authService.setToken(token);

        // Récupérer l'utilisateur depuis le token
        const user = this.authService.getUser();
        if (!user || !user.roles) {
          this.errorMessage = 'Rôles non trouvés dans le token';
          return;
        }

        // Normaliser les rôles pour éviter "ROLE_ROLE_USER"
        user.roles = user.roles.map((r: string) => r.replace('ROLE_ROLE_', 'ROLE_'));

        // Navigation selon le rôle
        if (user.roles.includes('ROLE_ADMIN')) {
          this.router.navigate(['/admin/users']);
        } else if (user.roles.includes('ROLE_MANAGER')) {
          this.router.navigate(['/dashboard']);
        } else if (user.roles.includes('ROLE_USER')) {
          this.router.navigate(['/user/dashboard']);
        } else {
          this.router.navigate(['/login']);
        }
      },
      error: (err) => {
        console.error('Login error', err);
        this.errorMessage = 'Nom d’utilisateur ou mot de passe invalide';
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
