import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task, TaskStatus, CreateTaskRequest, UpdateTaskRequest } from '../../models/task.model';
import { TaskSummary } from '../../models/stats.model';
import { TaskService } from '../../services/task.service';
import { StatsService } from '../../services/stats.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-page">
      <div class="dashboard-container">
        
        <!-- Header -->
        <div class="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p class="subtitle">Manage tasks and track execution across your microservices</p>
          </div>
          <button class="btn btn-primary" (click)="openCreateModal()">
            + New Task
          </button>
        </div>

        <!-- Metrics Overview Cards -->
        <div class="stats-grid">
          <div class="card stat-card">
            <span class="stat-label">Total Tasks</span>
            <span class="stat-value">{{ summary?.totalTasks ?? 0 }}</span>
          </div>
          <div class="card stat-card stat-pending">
            <span class="stat-label">Pending</span>
            <span class="stat-value text-pending">{{ summary?.pendingTasks ?? 0 }}</span>
          </div>
          <div class="card stat-card stat-progress">
            <span class="stat-label">In Progress</span>
            <span class="stat-value text-progress">{{ summary?.inProgressTasks ?? 0 }}</span>
          </div>
          <div class="card stat-card stat-completed">
            <span class="stat-label">Completed</span>
            <span class="stat-value text-completed">{{ summary?.completedTasks ?? 0 }}</span>
          </div>
        </div>

        <!-- Admin Summary Banner (if ADMIN) -->
        <div *ngIf="isAdmin() && adminSummary" class="card admin-card">
          <div class="admin-badge">Admin System View</div>
          <div class="admin-content">
            <strong>System-wide totals:</strong> {{ adminSummary.totalTasks }} total tasks across all registered users 
            ({{ adminSummary.completedTasks }} completed, {{ adminSummary.inProgressTasks }} in progress, {{ adminSummary.pendingTasks }} pending).
          </div>
        </div>

        <!-- Task List Header & Filter -->
        <div class="task-section-header">
          <h2>My Tasks ({{ filteredTasks.length }})</h2>
          <div class="filter-controls">
            <button
              class="filter-btn"
              [class.active]="activeFilter === 'ALL'"
              (click)="setFilter('ALL')">All</button>
            <button
              class="filter-btn"
              [class.active]="activeFilter === 'PENDING'"
              (click)="setFilter('PENDING')">Pending</button>
            <button
              class="filter-btn"
              [class.active]="activeFilter === 'IN_PROGRESS'"
              (click)="setFilter('IN_PROGRESS')">In Progress</button>
            <button
              class="filter-btn"
              [class.active]="activeFilter === 'COMPLETED'"
              (click)="setFilter('COMPLETED')">Completed</button>
          </div>
        </div>

        <!-- Loading & Alerts -->
        <div *ngIf="loading" class="loading-state">
          Loading tasks and stats from backend...
        </div>

        <div *ngIf="errorMessage" class="alert alert-danger">
          {{ errorMessage }}
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading && filteredTasks.length === 0" class="card empty-state">
          <span class="empty-icon">📋</span>
          <h3>No tasks found</h3>
          <p>Get started by creating your first task above.</p>
        </div>

        <!-- Task Grid -->
        <div *ngIf="!loading && filteredTasks.length > 0" class="tasks-grid">
          <div *ngFor="let task of filteredTasks" class="card task-card">
            <div class="task-card-header">
              <span class="badge" [ngClass]="'badge-' + task.status.toLowerCase()">
                {{ task.status.replace('_', ' ') }}
              </span>
              <span class="task-date">{{ task.createdAt | date:'shortDate' }}</span>
            </div>

            <h3 class="task-title">{{ task.title }}</h3>
            <p class="task-desc">{{ task.description || 'No description provided.' }}</p>

            <div class="task-card-footer">
              <div class="status-selector">
                <label for="status-{{task.id}}">Status:</label>
                <select
                  id="status-{{task.id}}"
                  [ngModel]="task.status"
                  (ngModelChange)="onStatusChange(task, $event)">
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              <div class="task-actions">
                <button class="btn btn-secondary btn-sm" (click)="openEditModal(task)">Edit</button>
                <button class="btn btn-danger btn-sm" (click)="onDeleteTask(task.id)">Delete</button>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Create / Edit Modal -->
      <div *ngIf="isModalOpen" class="modal-backdrop" (click)="closeModal()">
        <div class="modal-content card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editingTask ? 'Edit Task' : 'Create New Task' }}</h3>
            <button class="close-btn" (click)="closeModal()">&times;</button>
          </div>

          <form (ngSubmit)="saveTask()">
            <div class="form-group">
              <label for="modal-title">Task Title</label>
              <input
                id="modal-title"
                type="text"
                name="title"
                [(ngModel)]="taskForm.title"
                required
                placeholder="e.g. Implement Flyway migration"
              />
            </div>

            <div class="form-group">
              <label for="modal-desc">Description</label>
              <textarea
                id="modal-desc"
                name="description"
                rows="3"
                [(ngModel)]="taskForm.description"
                placeholder="Details about this task..."
              ></textarea>
            </div>

            <div class="form-group">
              <label for="modal-status">Status</label>
              <select id="modal-status" name="status" [(ngModel)]="taskForm.status">
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!taskForm.title">
                {{ editingTask ? 'Save Changes' : 'Create Task' }}
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .dashboard-page {
      padding: 2rem 1.5rem 4rem;
    }
    .dashboard-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    .dashboard-header h1 {
      font-size: 1.85rem;
      font-weight: 700;
    }
    .subtitle {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin-top: 0.2rem;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .stat-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-main);
    }
    .text-pending { color: #d97706; }
    .text-progress { color: #2563eb; }
    .text-completed { color: #059669; }

    .admin-card {
      background: #fdf4ff;
      border: 1px solid #f0abfc;
      margin-bottom: 2rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .admin-badge {
      background: #c026d3;
      color: #ffffff;
      padding: 0.25rem 0.65rem;
      font-size: 0.75rem;
      font-weight: 700;
      border-radius: 4px;
      white-space: nowrap;
    }
    .admin-content {
      font-size: 0.9rem;
      color: #701a75;
    }

    .task-section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }
    .task-section-header h2 {
      font-size: 1.25rem;
      font-weight: 700;
    }
    .filter-controls {
      display: flex;
      gap: 0.5rem;
    }
    .filter-btn {
      background: #f1f5f9;
      color: var(--text-muted);
      padding: 0.35rem 0.85rem;
      font-size: 0.8rem;
      font-weight: 600;
      border-radius: 9999px;
      border: 1px solid transparent;
    }
    .filter-btn:hover {
      background: #e2e8f0;
    }
    .filter-btn.active {
      background: var(--primary);
      color: #ffffff;
    }

    .tasks-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
    }
    .task-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 1rem;
    }
    .task-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .task-date {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .task-title {
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--text-main);
    }
    .task-desc {
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.45;
      flex-grow: 1;
    }
    .task-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.85rem;
      border-top: 1px solid var(--border);
    }
    .status-selector {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .status-selector label {
      margin-bottom: 0;
      font-size: 0.75rem;
    }
    .status-selector select {
      width: auto;
      padding: 0.25rem 0.5rem;
      font-size: 0.8rem;
    }
    .task-actions {
      display: flex;
      gap: 0.4rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
    }
    .empty-icon {
      font-size: 2.5rem;
      display: block;
      margin-bottom: 0.75rem;
    }
    .loading-state {
      padding: 2rem;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.95rem;
    }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
    }
    .modal-content {
      width: 100%;
      max-width: 480px;
      padding: 2rem;
      background: #ffffff;
      animation: modalFadeIn 0.2s ease-out;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .close-btn {
      background: transparent;
      font-size: 1.5rem;
      color: var(--text-muted);
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }
    .form-group {
      margin-bottom: 1.15rem;
    }
    @keyframes modalFadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class DashboardComponent implements OnInit {
  tasks: Task[] = [];
  summary: TaskSummary | null = null;
  adminSummary: TaskSummary | null = null;
  loading = false;
  errorMessage = '';

  activeFilter: 'ALL' | TaskStatus = 'ALL';

  isModalOpen = false;
  editingTask: Task | null = null;
  taskForm: { title: string; description: string; status: TaskStatus } = {
    title: '',
    description: '',
    status: 'PENDING'
  };

  constructor(
    private taskService: TaskService,
    private statsService: StatsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = '';

    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to load tasks from task-service';
      }
    });

    this.statsService.getUserSummary().subscribe({
      next: (summary) => this.summary = summary,
      error: () => {
        // Fallback: calculate summary locally if stats service is offline
        this.calculateLocalSummary();
      }
    });

    if (this.isAdmin()) {
      this.statsService.getAdminSummary().subscribe({
        next: (adm) => this.adminSummary = adm,
        error: () => {}
      });
    }
  }

  get filteredTasks(): Task[] {
    if (this.activeFilter === 'ALL') {
      return this.tasks;
    }
    return this.tasks.filter(t => t.status === this.activeFilter);
  }

  setFilter(filter: 'ALL' | TaskStatus): void {
    this.activeFilter = filter;
  }

  isAdmin(): boolean {
    return this.authService.currentUser()?.role === 'ROLE_ADMIN';
  }

  openCreateModal(): void {
    this.editingTask = null;
    this.taskForm = { title: '', description: '', status: 'PENDING' };
    this.isModalOpen = true;
  }

  openEditModal(task: Task): void {
    this.editingTask = task;
    this.taskForm = {
      title: task.title,
      description: task.description,
      status: task.status
    };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingTask = null;
  }

  saveTask(): void {
    if (this.editingTask) {
      const updateReq: UpdateTaskRequest = {
        title: this.taskForm.title,
        description: this.taskForm.description,
        status: this.taskForm.status
      };
      this.taskService.updateTask(this.editingTask.id, updateReq).subscribe({
        next: (updated) => {
          const index = this.tasks.findIndex(t => t.id === updated.id);
          if (index !== -1) this.tasks[index] = updated;
          this.closeModal();
          this.loadStats();
        },
        error: (err) => alert(err.error?.message || 'Failed to update task')
      });
    } else {
      const createReq: CreateTaskRequest = {
        title: this.taskForm.title,
        description: this.taskForm.description,
        status: this.taskForm.status
      };
      this.taskService.createTask(createReq).subscribe({
        next: (created) => {
          this.tasks.unshift(created);
          this.closeModal();
          this.loadStats();
        },
        error: (err) => alert(err.error?.message || 'Failed to create task')
      });
    }
  }

  onStatusChange(task: Task, newStatus: TaskStatus): void {
    const updateReq: UpdateTaskRequest = {
      title: task.title,
      description: task.description,
      status: newStatus
    };
    this.taskService.updateTask(task.id, updateReq).subscribe({
      next: (updated) => {
        task.status = updated.status;
        this.loadStats();
      },
      error: (err) => alert(err.error?.message || 'Failed to update status')
    });
  }

  onDeleteTask(id: number): void {
    if (!confirm('Are you sure you want to delete this task?')) return;

    this.taskService.deleteTask(id).subscribe({
      next: () => {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.loadStats();
      },
      error: (err) => alert(err.error?.message || 'Failed to delete task')
    });
  }

  private loadStats(): void {
    this.statsService.getUserSummary().subscribe({
      next: (summary) => this.summary = summary,
      error: () => this.calculateLocalSummary()
    });
  }

  private calculateLocalSummary(): void {
    this.summary = {
      totalTasks: this.tasks.length,
      pendingTasks: this.tasks.filter(t => t.status === 'PENDING').length,
      inProgressTasks: this.tasks.filter(t => t.status === 'IN_PROGRESS').length,
      completedTasks: this.tasks.filter(t => t.status === 'COMPLETED').length
    };
  }
}
