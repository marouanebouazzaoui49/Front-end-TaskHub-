import { NgModule, Injectable } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS, HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AppComponent } from './app.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { TaskComponent } from './components/tasks/tasks.component';
import { ProjectsComponent } from './components/projects/projects.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { AppRoutingModule } from './app-routing.module';
import { AdminLayoutComponent } from './admin/admin-layout/admin-layout.component';
import { UsersComponent } from './admin/users/users.component';
import { UserLayoutComponent } from './user/user-layout/user-layout.component';
import { TaskDashboardComponent } from './user/task-dashboard/task-dashboard.component';
import { VitalDashboardComponent } from './user/vital-dashboard/vital-dashboard.component';
import { ViewProjectComponent } from './view-project/view-project.component';
import { SettingsComponent } from './user/settings/settings.component';
import { ManagerSettingComponent } from './components/manager-setting/manager-setting.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { UserTaskComponent } from './user/user-task/user-task.component';


// ----------- Auth Interceptor -----------------
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('token');
    let clonedReq = req;
    if (token) {
      clonedReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
    }
    console.log('HTTP Request:', clonedReq); // <-- vérifie le header Authorization
    return next.handle(clonedReq);
  }
}

// --------------------------------------------

@NgModule({
  declarations: [
    ManagerSettingComponent,
    SettingsComponent,
    SignUpComponent,
    TaskComponent,
    AppComponent,
    DashboardComponent,
    LoginComponent,
    ProjectsComponent,
    SidebarComponent,
    AdminLayoutComponent,
    TaskDashboardComponent,
    VitalDashboardComponent,
    ViewProjectComponent,
    SettingsComponent,
    ManagerSettingComponent,
    UserTaskComponent,
    
    
  ],
  imports: [
    DragDropModule,
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
