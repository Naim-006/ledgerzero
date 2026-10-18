import {
  DataService,
  ActionService,
  ReminderService,
  AgentService,
  AuthService,
} from "../contracts";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errorBody.message || `API request failed with status ${res.status}`);
  }

  return res.json();
}

export class ApiDataService implements Partial<DataService> {
  async getBusiness() {
    return apiFetch<any>("/business");
  }
  async getCashPosition() {
    return apiFetch<any>("/finance/cash-position");
  }
  async getForecast(days: 7 | 30) {
    return apiFetch<any>(`/finance/forecast?days=${days}`);
  }
  // Remaining backend endpoints will be bound to teammate's API
}

export class ApiActionService implements Partial<ActionService> {
  async getActionTasks() {
    return apiFetch<any>("/actions");
  }
  async approveActionTask(taskId: string, memberId: string, memberName: string, reason?: string) {
    return apiFetch<any>(`/actions/${taskId}/approve`, {
      method: "POST",
      body: JSON.stringify({ memberId, memberName, reason }),
    });
  }
}
