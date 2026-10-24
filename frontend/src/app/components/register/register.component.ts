import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-container">
      <div class="card auth-card">
        <div class="auth-header">
          <h2>Create an account</h2>
          <p>Get started with TaskFlow microservices</p>
        </div>

        <div *ngIf="errorMessage" class="alert alert-danger">
          {{ errorMessage }}
        </div>

        <form (ngSubmit)="onSubmit()" #regForm="ngForm">
          <div class="form-group">
            <label for="username">Username</label>
            <input
              id="username"
              type="text"
              name="username"
              [(ngModel)]="username"
              required
              minlength="3"
              placeholder="e.g. alex"
            />
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              [(ngModel)]="email"
              required
              placeholder="alex@example.com"
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              [(ngModel)]="password"
              required
              minlength="6"
              placeholder="At least 6 characters"
            />
          </div>

          <div class="form-group">
            <label for="role">Role</label>
            <select id="role" name="role" [(ngModel)]="role">
              <option value="USER">Standard User (USER)</option>
              <option value="ADMIN">Administrator (ADMIN)</option>
            </select>
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading || !regForm.form.valid">
            <span *ngIf="loading">Creating account...</span>
            <span *ngIf="!loading">Create Account</span>
          </button>
        </form>

        <div class="auth-footer">
          Already have an account? <a routerLink="/login">Log in here</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: calc(100vh - 70px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
    }
    .auth-card {
      width: 100%;
      max-width: 440px;
      padding: 2.5rem;
    }
    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .auth-header h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-main);
    }
    .auth-header p {
      color: var(--text-muted);
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
    .form-group {
      margin-bottom: 1.25rem;
    }
    .btn-block {
      width: 100%;
      margin-top: 0.5rem;
    }
    .auth-footer {
      text-align: center;
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-top: 1.5rem;
    }
    .alert-danger {
      background: var(--danger-bg);
      color: var(--danger);
      padding: 0.75rem 1rem;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      margin-bottom: 1.25rem;
      border: 1px solid #fecaca;
    }
  `]
})
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  role = 'USER';
  loading = false;
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    this.loading = true;
    this.errorMessage = '';

    this.authService.register({
      username: this.username,
      email: this.email,
      password: this.password,
      role: this.role
    }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Registration failed. Please check your details.';
      }
    });
  }
}
