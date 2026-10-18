import { describe, it, expect } from "vitest";
import { ROLE_PERMISSIONS, Role } from "@/domain/types";

describe("Role Permissions & Security Boundaries", () => {
  it("restricts Viewer and Accountant from approving high-risk autonomous actions", () => {
    expect(ROLE_PERMISSIONS.Viewer.canApproveActions).toBe(false);
    expect(ROLE_PERMISSIONS.Accountant.canApproveActions).toBe(false);
    expect(ROLE_PERMISSIONS.Admin.canApproveActions).toBe(true);
    expect(ROLE_PERMISSIONS.Owner.canApproveActions).toBe(true);
  });

  it("restricts Viewer from mutating ledger records while allowing Accountant", () => {
    expect(ROLE_PERMISSIONS.Viewer.canMutateFinancialRecords).toBe(false);
    expect(ROLE_PERMISSIONS.Accountant.canMutateFinancialRecords).toBe(true);
    expect(ROLE_PERMISSIONS.Admin.canMutateFinancialRecords).toBe(true);
    expect(ROLE_PERMISSIONS.Owner.canMutateFinancialRecords).toBe(true);
  });

  it("restricts non-Owner roles from managing team memberships", () => {
    expect(ROLE_PERMISSIONS.Owner.canManageTeam).toBe(true);
    expect(ROLE_PERMISSIONS.Admin.canManageTeam).toBe(false);
    expect(ROLE_PERMISSIONS.Accountant.canManageTeam).toBe(false);
    expect(ROLE_PERMISSIONS.Viewer.canManageTeam).toBe(false);
  });
});
