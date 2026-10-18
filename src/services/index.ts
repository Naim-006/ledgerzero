import { SupabaseDataService } from "./supabase/data-service";
import { SupabaseActionService } from "./supabase/action-service";
import { SupabaseReminderService } from "./supabase/reminder-service";
import { SupabaseAgentService } from "./supabase/agent-service";
import { SupabaseAuthService } from "./supabase/auth-service";

import { mockDataService } from "./mock/data-service";
import { mockActionService } from "./mock/action-service";
import { mockReminderService } from "./mock/reminder-service";
import { mockAgentService } from "./mock/agent-service";
import { mockAuthService } from "./mock/auth-service";
import { ApiDataService, ApiActionService } from "./api/client";
import {
  DataService,
  ActionService,
  ReminderService,
  AgentService,
  AuthService,
} from "./contracts";

export const IS_API_MODE = process.env.NEXT_PUBLIC_DATA_MODE === "api";
export const IS_MOCK_MODE = process.env.NEXT_PUBLIC_DATA_MODE === "mock";

// Production instances wired directly to live Supabase PostgreSQL
const supabaseDataService = new SupabaseDataService();
const supabaseActionService = new SupabaseActionService();
const supabaseReminderService = new SupabaseReminderService();
const supabaseAgentService = new SupabaseAgentService(
  supabaseDataService,
  supabaseActionService,
  supabaseReminderService
);
const supabaseAuthService = new SupabaseAuthService();

export const dataService: DataService = IS_MOCK_MODE
  ? mockDataService
  : IS_API_MODE
  ? ((new ApiDataService() as unknown) as DataService)
  : supabaseDataService;

export const actionService: ActionService = IS_MOCK_MODE
  ? mockActionService
  : IS_API_MODE
  ? ((new ApiActionService() as unknown) as ActionService)
  : supabaseActionService;

export const reminderService: ReminderService = IS_MOCK_MODE
  ? mockReminderService
  : supabaseReminderService;

export const agentService: AgentService = IS_MOCK_MODE
  ? mockAgentService
  : supabaseAgentService;

export const authService: AuthService = IS_MOCK_MODE
  ? mockAuthService
  : supabaseAuthService;

export * from "./contracts";
