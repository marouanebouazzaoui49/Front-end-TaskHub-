// src/app/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const expectedRole = route.data['role'];
    const user = this.authService.getUser();

    if (!user) {
      this.router.navigate(['/login']);
      return false;
    }

    if (expectedRole && !user.roles.includes(expectedRole)) {
      this.router.navigate(['/login']);
      return false;
    }

    return true;
  }
}
