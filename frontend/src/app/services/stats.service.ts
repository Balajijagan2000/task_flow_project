import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TaskSummary } from '../models/stats.model';

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private readonly STATS_API = 'http://localhost:8083/api/stats';

  constructor(private http: HttpClient) {}

  getUserSummary(): Observable<TaskSummary> {
    return this.http.get<TaskSummary>(`${this.STATS_API}/summary`);
  }

  getAdminSummary(): Observable<TaskSummary> {
    return this.http.get<TaskSummary>(`${this.STATS_API}/admin`);
  }
}
