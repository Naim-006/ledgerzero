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

export const dataService: DataService = IS_API_MODE
  ? ((new ApiDataService() as unknown) as DataService)
  : mockDataService;

export const actionService: ActionService = IS_API_MODE
  ? ((new ApiActionService() as unknown) as ActionService)
  : mockActionService;

export const reminderService: ReminderService = mockReminderService;
export const agentService: AgentService = mockAgentService;
export const authService: AuthService = mockAuthService;

export * from "./contracts";
