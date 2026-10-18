import { AuthService } from "../contracts";
import { mockStore, simulateDelay } from "./store";
import { Member, Business, Role } from "@/domain/types";

export class MockAuthService implements AuthService {
  async getCurrentMember(): Promise<Member> {
    await simulateDelay(20);
    const state = mockStore.getState();
    const member = state.members.find((m) => m.id === state.currentMemberId);
    return member || state.members[0];
  }

  async switchRole(role: Role): Promise<Member> {
    await simulateDelay(20);
    mockStore.setCurrentMemberRole(role);
    return this.getCurrentMember();
  }

  async switchBusiness(businessId: string): Promise<Business> {
    await simulateDelay(20);
    return mockStore.getState().business;
  }
}

export const mockAuthService = new MockAuthService();
