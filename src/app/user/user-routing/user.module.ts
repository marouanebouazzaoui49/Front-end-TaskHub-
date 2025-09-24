import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { UserLayoutComponent } from '../user-layout/user-layout.component';
import { UserRoutingModule } from './user-routing.module';

@NgModule({
  declarations: [

    UserLayoutComponent,
    
  ],
  imports: [
    CommonModule,
    RouterModule,
    UserRoutingModule
  ]
})
export class UserModule { }
