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
  const { business, currentRole, switchRole, permissions } = useApp();

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
        businessId: business?.id || "biz_default",
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
          <h1 className="text-2xl font-bold text-forest tracking-tight">
            Team
          </h1>
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

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Team Members</CardTitle>
        </CardHeader>
        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slateSurface-200 dark:divide-slate-800">
          {members.map((m) => (
            <div key={m.id} className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-forest-action/10 text-forest-action font-bold text-xs flex items-center justify-center shrink-0">
                  {m.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-sm text-brand-900 dark:text-slate-100">{m.name}</div>
                  <div className="text-xs text-brand-700/70 dark:text-slate-400">{m.email}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
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
                <span className="text-[10px] text-success-700 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-success-500" />
                  Active
                </span>
              </div>
            </div>
          ))}
        </div>
        {/* Desktop Table */}
        <div className="hidden md:block">
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
        </div>
      </Card>

      {/* Permissions Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Permissions Matrix</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
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
        </div>
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
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
