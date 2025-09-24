import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { HttpResponse } from '@angular/common/http';

@Component({
  selector: 'app-signup',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
})
export class SignUpComponent {
  user: any = {
    username: '',
    fullName: '',
    email: '',
    password: ''
  };

  errorMessage: string = '';
  successMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  signup() {
    this.errorMessage = '';
    this.successMessage = '';

    // Vérification des champs obligatoires
    if (!this.user.username || !this.user.fullName || !this.user.email || !this.user.password) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    // Envoi au backend
    this.authService.signup(this.user).subscribe({
      next: (res: HttpResponse<any>) => {
        // Angular HttpClient avec observe: 'response'
        if (res.status === 201) {
          this.successMessage = 'Inscription réussie ! Connectez-vous maintenant.';
          // Redirection vers login après 2 secondes
          setTimeout(() => this.router.navigate(['/login']), 2000);
        } else {
          this.errorMessage = 'Une erreur est survenue lors de l’inscription';
        }
      },
      error: err => {
        console.error('Erreur signup', err);
        this.errorMessage = err.error?.message || 'Une erreur est survenue lors de l’inscription';
      }
    });
  }
}
