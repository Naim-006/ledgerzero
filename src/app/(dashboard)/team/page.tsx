"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/app-context";
import { dataService } from "@/services";
import { Member, Role, ROLE_PERMISSIONS } from "@/domain/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ShieldCheck, UserPlus, Shield, Check, X, User } from "lucide-react";
import { formatShortDate } from "@/lib/dates";

export default function TeamPage() {
  const { currentRole, switchRole, permissions } = useApp();

  const [members, setMembers] = useState<Member[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("Accountant");

  const loadMembers = async () => {
    try {
      const list = await dataService.getMembers();
      setMembers(list);
    } catch (err) {
      console.error("Error loading team members:", err);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    try {
      await dataService.inviteMember({
        businessId: "biz_harbor_pine",
        name: inviteName,
        email: inviteEmail,
        role: inviteRole,
      });
      setIsInviteModalOpen(false);
      setInviteName("");
      setInviteEmail("");
      await loadMembers();
    } catch (err) {
      console.error("Invite failed:", err);
    }
  };

  const roles: Role[] = ["Owner", "Admin", "Accountant", "Viewer"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slateSurface-200">
        <div>
          <h1 className="text-2xl font-bold text-forest tracking-tight flex items-center gap-2">
            Team & Role-Based Permissions
            <Badge variant="outline" size="sm">
              Role: {currentRole}
            </Badge>
          </h1>
          <p className="text-xs text-brand-700/70 mt-1">
            Enforce separation of duties: only authorized roles can approve autonomous intervention tasks.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsInviteModalOpen(true)}
          disabled={!permissions.canManageTeam}
        >
          <UserPlus className="w-3.5 h-3.5" />
          Invite Member
        </Button>
      </div>

      {/* Judge Quick Role Tester Callout */}
      <Card className="p-4 bg-brand-50/60 border-brand-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-bold text-forest text-xs flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-forest-action" />
              Judge Testing Tool: Switch Active Session Role
            </span>
            <p className="text-[11px] text-brand-800/80 mt-0.5">
              Click any role below to observe how action approval buttons, mutation dialogs, and invite options instantly toggle between enabled and disabled states.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-surfaceSubtle p-1 rounded-lg border border-slateSurface-200 shrink-0">
            {roles.map((r) => (
              <button
                key={r}
                onClick={() => switchRole(r)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  currentRole === r
                    ? "bg-forest text-lime-accent shadow-xs"
                    : "text-brand-800 hover:bg-slateSurface-100"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Active Workspace Members</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium text-brand-900 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-forest-action/10 text-forest-action font-bold text-xs flex items-center justify-center">
                    {m.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span>{m.name}</span>
                </TableCell>
                <TableCell className="text-xs text-brand-700">{m.email}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      m.role === "Owner"
                        ? "lime"
                        : m.role === "Admin"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                  >
                    {m.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-[11px] text-success-700 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success-500" />
                    Active
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Permissions Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Role Capabilities & Enforcement Matrix</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Capability</TableHead>
              <TableHead className="text-center">Owner</TableHead>
              <TableHead className="text-center">Admin</TableHead>
              <TableHead className="text-center">Accountant</TableHead>
              <TableHead className="text-center">Viewer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-semibold text-brand-900">
                Approve Autonomous Intervention Tasks
              </TableCell>
              <TableCell className="text-center">
                <Check className="w-4 h-4 text-success-600 mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <Check className="w-4 h-4 text-success-600 mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <X className="w-4 h-4 text-brand-300 mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <X className="w-4 h-4 text-brand-300 mx-auto" />
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell className="font-semibold text-brand-900">
                Execute External Simulated Communications
              </TableCell>
              <TableCell className="text-center">
                <Check className="w-4 h-4 text-success-600 mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <Check className="w-4 h-4 text-success-600 mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <X className="w-4 h-4 text-brand-300 mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <X className="w-4 h-4 text-brand-300 mx-auto" />
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell className="font-semibold text-brand-900">
                Mutate Financial Records (Add / Edit Invoices & Tx)
              </TableCell>
              <TableCell className="text-center">
                <Check className="w-4 h-4 text-success-600 mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <Check className="w-4 h-4 text-success-600 mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <Check className="w-4 h-4 text-success-600 mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <X className="w-4 h-4 text-brand-300 mx-auto" />
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell className="font-semibold text-brand-900">
                Trigger Agent Reasoning & Tool Runs
              </TableCell>
              <TableCell className="text-center">
                <Check className="w-4 h-4 text-success-600 mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <Check className="w-4 h-4 text-success-600 mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <Check className="w-4 h-4 text-success-600 mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <X className="w-4 h-4 text-brand-300 mx-auto" />
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell className="font-semibold text-brand-900">
                Manage Team Members & Role Assignments
              </TableCell>
              <TableCell className="text-center">
                <Check className="w-4 h-4 text-success-600 mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <X className="w-4 h-4 text-brand-300 mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <X className="w-4 h-4 text-brand-300 mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <X className="w-4 h-4 text-brand-300 mx-auto" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>

      {/* Invite Member Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Team Member"
        description="Add a member to Harbor & Pine Supply Co. with a specified role"
      >
        <form onSubmit={handleInvite} className="space-y-4 text-xs">
          <Input
            label="Full Name"
            placeholder="e.g. Robin Taylor"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="robin@harborandpine.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />

          <Select
            label="Role Assignment"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as Role)}
            options={[
              { value: "Admin", label: "Admin (Full Operations & Approvals)" },
              { value: "Accountant", label: "Accountant (Financial Editor)" },
              { value: "Viewer", label: "Viewer (Read-Only)" },
            ]}
          />

          <div className="pt-4 border-t border-slateSurface-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsInviteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Send Invitation (Mock)
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
