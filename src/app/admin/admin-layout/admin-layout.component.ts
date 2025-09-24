// admin-layout.component.ts
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { UsersService, User } from '../../services/user.service';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  isSidebarCollapsed = false;
  isMobileSidebarOpen = false;
  currentUser: User | null = null;
  private destroy$ = new Subject<void>();
  private mobileBreakpoint = 992;

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UsersService
  ) {
    // Restaurer l'état de la sidebar depuis localStorage
    this.isSidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  }

  ngOnInit(): void {
    this.userService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => (this.currentUser = user));

    this.userService.loadCurrentUserFromStorageOrApi();
    this.handleResize();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Toggle sidebar
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

  // Gestion du scroll pour mobile
  private toggleBodyScroll(disable: boolean) {
    document.body.style.overflow = disable ? 'hidden' : '';
    document.body.classList.toggle('sidebar-open', disable);
  }

  closeMobileSidebar(): void {
    this.isMobileSidebarOpen = false;
    this.toggleBodyScroll(false);
  }

  // Resize window
  @HostListener('window:resize')
  handleResize(): void {
    if (window.innerWidth > this.mobileBreakpoint && this.isMobileSidebarOpen) {
      this.closeMobileSidebar();
    }
  }

  // Click outside sidebar mobile
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const sidebar = document.querySelector('.admin-sidebar');
    const toggleBtn = document.querySelector('.btn-light');

    if (this.isMobileSidebarOpen && sidebar && !sidebar.contains(target) && toggleBtn && !toggleBtn.contains(target)) {
      this.closeMobileSidebar();
    }
  }

  // Escape key to close mobile sidebar
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isMobileSidebarOpen) this.closeMobileSidebar();
  }

  private isMobile(): boolean {
    return window.innerWidth <= this.mobileBreakpoint;
  }

  private animateContentResize(): void {
    const content = document.querySelector('.admin-content') as HTMLElement;
    if (!content) return;

    content.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    setTimeout(() => (content.style.transition = ''), 400);
  }

  logout(): void {
    document.body.style.transition = 'opacity 0.3s ease';
    document.body.style.opacity = '0.8';
    setTimeout(() => {
      this.authService.logout();
      localStorage.removeItem('currentUser');
      localStorage.removeItem('sidebarCollapsed');
      this.router.navigate(['/login']);
      document.body.style.opacity = '1';
      document.body.style.transition = '';
    }, 200);
  }

  // User getters
  get userInitial(): string {
    return this.currentUser?.fullName?.charAt(0).toUpperCase() || 'A';
  }

  get userFullName(): string {
    return this.currentUser?.fullName || 'Admin User';
  }

  get userRole(): string {
    return this.currentUser?.role?.replace('ROLE_', '') || 'Admin';
  }

  get roleClass(): string {
    switch (this.userRole.toLowerCase()) {
      case 'admin': return 'user-role admin-role';
      case 'manager': return 'user-role manager-role';
      case 'user': return 'user-role user-role';
      case 'moderator': return 'user-role moderator-role';
      default: return 'user-role default-role';
    }
  }
}
