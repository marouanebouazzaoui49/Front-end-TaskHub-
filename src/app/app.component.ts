import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { UsersService, User } from './services/user.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styles: [`
/* ===================== Sidebar ===================== */
.sidebar {
  width: 260px;
  background: linear-gradient(160deg, #373B44, #c2410c);
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: fixed;
  z-index: 1010;
  transition: width 0.5s ease, left 0.5s ease;
  overflow: hidden;
}
.sidebar.collapsed { width: 80px; }
.sidebar.show { left: 0; }
.sidebar .logo { max-width: 130px; margin: 0 auto; transition: transform 0.6s ease; cursor: pointer; }
.sidebar .logo:hover { transform: rotate(-12deg) scale(1.2); }

/* Profil utilisateur */
.user-profile { text-align: center; padding: 0 1rem; }
.profile-circle {
  width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-weight: 600; font-size: 1.5rem; color: #fff; background: rgba(255,255,255,0.15);
  margin: 0 auto 0.5rem auto; transition: transform 0.4s ease, box-shadow 0.4s ease, background 0.4s ease;
}
.profile-circle:hover {
  transform: scale(1.15) rotate(6deg);
  box-shadow: 0 10px 30px rgba(0,0,0,0.35);
  background: rgba(255,255,255,0.25);
}

/* Badge Manager */
.badge-manager {
  background-color: #ff4500;
  color: white;
  font-size: 0.65rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  margin-top: 4px;
  display: inline-block;
}

/* Menu */
.nav-link {
  color: #fff; font-weight: 500; border-radius: 12px; position: relative; overflow: hidden;
  padding: 0.5rem 1rem !important; margin-bottom: 0.25rem; transition: transform 0.3s ease, background 0.3s ease;
}
.nav-link span, .nav-link i { position: relative; z-index: 1; }
.nav-link:hover { transform: translateX(6px); background: rgba(255,255,255,0.1); }
.nav-link.active-menu { background: #fff; color: #373B44; font-weight: 600; box-shadow: 0 6px 20px rgba(0,0,0,0.25); }

/* Logout */
.sidebar .mt-auto { margin-top: auto; }
.sidebar .btn-outline-light {
  width: 100%; border-radius: 50px; font-weight: 600; background: rgba(255,255,255,0.1);
  color: #fff; border: 1px solid rgba(255,255,255,0.3); transition: all 0.4s ease;
}
.sidebar .btn-outline-light:hover { background: #fff; color: #373B44; border-color: #fff; }

/* ===================== Topbar ===================== */
.topbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.5rem 1.5rem; background: #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05); position: sticky; top: 0; z-index: 1000;
}
.profile-circle.small-profile {
  width: 38px; height: 38px; background: #f97316; color: #fff;
  font-weight: 600; font-size: 1rem; display: flex; align-items: center; justify-content: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.profile-circle.small-profile:hover { transform: scale(1.15) rotate(3deg); box-shadow: 0 6px 25px rgba(249,115,22,0.4); }

/* Dropdown Topbar */
.dropdown .btn {
  display: flex; align-items: center; gap: 0.5rem; font-weight: 500;
  background: #fff; border: 1px solid #ddd; border-radius: 6px; padding: 0.25rem 0.75rem;
  transition: all 0.3s ease;
}
.dropdown .btn:hover { background: #f8f9fa; }
.dropdown-menu { border-radius: 8px; box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
.dropdown-menu a.dropdown-item {
  transition: background 0.2s ease, color 0.2s ease;
}
.dropdown-menu a.dropdown-item:hover { background: #f97316; color: #fff; }

/* ===================== Main Content ===================== */
main { margin-left: 260px; flex:1; display:flex; flex-direction:column; transition: margin-left 0.5s ease; }
.sidebar.collapsed ~ main { margin-left: 80px; }
.content-area { flex:1; padding:2rem; overflow-y:auto; background-color: #f8f9fa; }

/* ===================== Responsive ===================== */
@media (max-width: 992px) {
  .sidebar { left:-260px; position: fixed; height:100vh; transition:left 0.5s ease; z-index:1020; }
  .sidebar.show { left:0; box-shadow:0 0 40px rgba(0,0,0,0.5); }
  main { margin-left:0; }
  .sidebar-backdrop { position:fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.5); z-index:1015; opacity:0; pointer-events:none; transition:opacity 0.3s ease; }
  .sidebar-backdrop.show { opacity:1; pointer-events:auto; }
  .topbar .btn-light.d-lg-none { display:flex; margin-right:0.5rem; }
}

  `]
})
export class AppComponent implements OnInit {
  currentDay: string;
  currentDate: string;
  currentUser: User | null = null;
  isSidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  isMobileSidebarOpen = false;
  mobileBreakpoint = 992;

  constructor(public router: Router, private userService: UsersService) {
    const now = new Date();
    this.currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    this.currentDate = now.toLocaleDateString('fr-FR');
  }

  ngOnInit() {





    
    // Abonnement sécurisé pour récupérer currentUser dès le premier chargement
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    this.userService.loadCurrentUserFromStorageOrApi();
  }

  logout() {
    this.userService.clearCurrentUser();
    this.currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }

  // Getters pour le profil
  get userInitial(): string {
    return this.currentUser?.fullName?.charAt(0).toUpperCase() || '';
  }

  get userFullName(): string {
    return this.currentUser?.fullName || '';
  }

  get userRole(): string {
    return this.currentUser?.role?.replace('ROLE_', '') || '';
  }

  get isManager(): boolean {
    return this.userRole === 'MANAGER';
  }

  isAuthPage(): boolean {
    return ['/login', '/signup', '/user', '/admin'].some(path => this.router.url.startsWith(path));
  }

  toggleSidebar(): void {
    if (this.isMobile()) {
      this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
      document.body.style.overflow = this.isMobileSidebarOpen ? 'hidden' : '';
    } else {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
      localStorage.setItem('sidebarCollapsed', String(this.isSidebarCollapsed));
    }
  }

  closeMobileSidebar() { this.isMobileSidebarOpen = false; document.body.style.overflow = ''; }
  private isMobile(): boolean { return window.innerWidth <= this.mobileBreakpoint; }

  @HostListener('window:resize')
  handleResize() {
    if (window.innerWidth > this.mobileBreakpoint && this.isMobileSidebarOpen) this.closeMobileSidebar();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.querySelector('.btn-light.d-lg-none');
    if (this.isMobileSidebarOpen && sidebar && !sidebar.contains(target) && toggleBtn && !toggleBtn.contains(target)) {
      this.closeMobileSidebar();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() { if (this.isMobileSidebarOpen) this.closeMobileSidebar(); }
}