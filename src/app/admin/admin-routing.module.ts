import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { UsersComponent } from './users/users.component';
import { AuthGuard } from '../guard-login/login-guard.guard'; 
import { AdminSettingsComponent } from './admin-settings/admin-settings.component';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard], // protège toute la section admin
    data: { role: 'ROLE_ADMIN' }, //  seulement les admin peuvent accéder
    children: [
      { path: 'users', component: UsersComponent },
      { path: 'settings',   component: AdminSettingsComponent
      }, // <-- ajouté ici
      { path: '', redirectTo: 'users', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {}
