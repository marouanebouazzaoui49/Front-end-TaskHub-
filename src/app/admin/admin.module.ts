import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UsersComponent } from './users/users.component';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { FormsModule } from '@angular/forms';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminSettingsComponent } from './admin-settings/admin-settings.component';

@NgModule({
  declarations: [
    AdminSettingsComponent,
    UsersComponent,
    
  ],
  imports: [
    CommonModule,
     FormsModule,
    AdminRoutingModule,
  RouterModule.forChild([
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: 'users', component: UsersComponent },
      { path: '', redirectTo: 'users', pathMatch: 'full' }
    ]
  }
])

  ]
})
export class AdminModule { }
