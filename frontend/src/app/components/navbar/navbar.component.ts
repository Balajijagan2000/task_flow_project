import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar">
      <div class="nav-container">
        <a routerLink="/" class="nav-brand">
          <span class="brand-icon">⚡</span>
          <span class="brand-name">TaskFlow</span>
        </a>

        <div class="nav-links">
          <ng-container *ngIf="authService.isAuthenticated(); else guestLinks">
            <span class="user-greeting">
              Welcome, <strong>{{ authService.currentUser()?.username }}</strong>
              <span class="role-badge">{{ authService.currentUser()?.role }}</span>
            </span>
            <button class="btn btn-secondary btn-sm" (click)="onLogout()">Log Out</button>
          </ng-container>
          <ng-template #guestLinks>
            <a routerLink="/login" class="nav-link">Log In</a>
            <a routerLink="/register" class="btn btn-primary btn-sm">Get Started</a>
          </ng-template>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background-color: #ffffff;
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: var(--shadow-sm);
    }
    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0.85rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--primary);
    }
    .brand-icon {
      font-size: 1.4rem;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }
    .nav-link {
      color: var(--text-muted);
      font-weight: 500;
      font-size: 0.9rem;
    }
    .nav-link:hover {
      color: var(--primary);
      text-decoration: none;
    }
    .user-greeting {
      font-size: 0.875rem;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .role-badge {
      background: #eef2ff;
      color: #4f46e5;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
    }
  `]
})
export class NavbarComponent {
  constructor(public authService: AuthService) {}

  onLogout(): void {
    this.authService.logout();
  }
}
