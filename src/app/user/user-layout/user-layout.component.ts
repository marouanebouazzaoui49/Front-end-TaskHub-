import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UsersService } from '../../services/user.service';

@Component({
  selector: 'app-user-layout',
  templateUrl: './user-layout.component.html',
  styleUrls: ['./user-layout.component.css']
})
export class UserLayoutComponent implements OnInit {
  isSidebarCollapsed = false;
  isMobileSidebarOpen = false;
  mobileBreakpoint = 992;

  currentDay: string;
  currentDate: string;
  currentUser: any = null;

  constructor(public router: Router, private userService: UsersService) {
    const now = new Date();
    this.currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    this.currentDate = now.toLocaleDateString('fr-FR');
  }

  ngOnInit(): void {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
    } else {
      this.loadCurrentUser();
    }

    const storedCollapsed = localStorage.getItem('sidebarCollapsed');
    if (storedCollapsed) {
      this.isSidebarCollapsed = storedCollapsed === 'true';
    }
  }

  toggleSidebar(): void {
    if (this.isMobile()) {
      this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
      this.toggleBodyScroll(this.isMobileSidebarOpen);
    } else {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
      localStorage.setItem('sidebarCollapsed', String(this.isSidebarCollapsed));
      this.animateContentResize();
    }
  }

  private toggleBodyScroll(disable: boolean) {
    document.body.style.overflow = disable ? 'hidden' : '';
    document.body.classList.toggle('sidebar-open', disable);
  }

  closeMobileSidebar(): void {
    this.isMobileSidebarOpen = false;
    this.toggleBodyScroll(false);
  }

  @HostListener('window:resize')
  handleResize(): void {
    if (window.innerWidth > this.mobileBreakpoint && this.isMobileSidebarOpen) {
      this.closeMobileSidebar();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const sidebar = document.querySelector('.user-sidebar');
    const toggleBtn = document.querySelector('.btn-light');

    if (this.isMobileSidebarOpen && sidebar && !sidebar.contains(target) &&
        toggleBtn && !toggleBtn.contains(target)) {
      this.closeMobileSidebar();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isMobileSidebarOpen) this.closeMobileSidebar();
  }

  private isMobile(): boolean {
    return window.innerWidth <= this.mobileBreakpoint;
  }

  private animateContentResize(): void {
    const content = document.querySelector('.user-content') as HTMLElement;
    if (!content) return;

    content.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    setTimeout(() => (content.style.transition = ''), 400);
  }

  loadCurrentUser() {
    this.userService.getCurrentUser().subscribe({
      next: user => this.currentUser = user,
      error: err => console.error('Error loading current user', err)
    });
  }

  logout(): void {
  this.userService.clearCurrentUser(); // <-- vide BehaviorSubject et localStorage
  this.currentUser = null; // pour forcer l’UI si jamais
  localStorage.removeItem('token');
  localStorage.removeItem('currentAdmin');
  this.router.navigate(['/login'])
  }
}  
