import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserLayoutComponent } from '../user-layout/user-layout.component';
import { TaskDashboardComponent } from '../task-dashboard/task-dashboard.component';
import { VitalDashboardComponent } from '../vital-dashboard/vital-dashboard.component';
import { SettingsComponent } from '../settings/settings.component';
import { UserTaskComponent } from '../user-task/user-task.component';

const routes: Routes = [
  {
    path: '',
    component: UserLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      // { path: 'dashboard/task-vital', component: DashboardUserComponent },
      { path: 'dashboard', component: TaskDashboardComponent },
     { path: 'vital-tasks', component: VitalDashboardComponent },
      { path: 'setting', component: SettingsComponent },
            { path: 'task', component: UserTaskComponent },




    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
