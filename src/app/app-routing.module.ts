import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TaskComponent } from './components/tasks/tasks.component';
import { ProjectsComponent } from './components/projects/projects.component';
import { AuthGuard } from './guard-login/login-guard.guard';
import { ManagerSettingComponent } from './components/manager-setting/manager-setting.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignUpComponent },

  // Manager routes
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard], data: { role: 'ROLE_MANAGER' } },
  { path: 'projects', component: ProjectsComponent, canActivate: [AuthGuard], data: { role: 'ROLE_MANAGER' } },
  { path: 'projects/:id/tasks', component: TaskComponent, canActivate: [AuthGuard], data: { role: 'ROLE_MANAGER' } },
  { path: 'tasks', component: TaskComponent, canActivate: [AuthGuard], data: { role: 'ROLE_MANAGER' } },
  { path: 'settings', component: ManagerSettingComponent, canActivate: [AuthGuard], data: { role: 'ROLE_MANAGER' } },


  

  // Admin module (lazy-loaded)
  { 
    path: 'admin', 
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
    // Si tu veux, tu peux gérer le guard dans le module Admin lui-même avec canActivateChild
  },

  // User module (lazy-loaded)
  { 
    path: 'user', 
    loadChildren: () => import('./user/user-routing/user.module').then(m => m.UserModule)
    // AuthGuard également à gérer dans user.module via canActivateChild si nécessaire
  },

  // 404 fallback
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
