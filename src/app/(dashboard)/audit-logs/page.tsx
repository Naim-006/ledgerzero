"use client";

import React, { useState, useEffect } from "react";
import { dataService } from "@/services";
import { AuditLog } from "@/domain/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  History,
  Bot,
  User,
  ShieldAlert,
  Search,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { formatShortDate } from "@/lib/dates";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [actorFilter, setActorFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      const list = await dataService.getAuditLogs(100);
      setLogs(list);
    };
    load();
  }, []);

  const filtered = logs.filter((log) => {
    if (actorFilter !== "all" && log.actorType !== actorFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.details.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.actorName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slateSurface-200">
        <div>
          <h1 className="text-2xl font-bold text-forest tracking-tight flex items-center gap-2">
            Agent Activity & Audit Logs
            <Badge variant="outline" size="sm">
              Immutable Trail
            </Badge>
          </h1>
          <p className="text-xs text-brand-700/70 mt-1">
            Complete cryptographic audit trail of all autonomous agent reasoning, human approvals, and ledger mutations.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-brand-700/50 absolute left-3 top-2.5" />
            <Input
              type="text"
              placeholder="Search audit trail by actor, action or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="w-40"
            options={[
              { value: "all", label: "All Actors" },
              { value: "agent", label: "Agent Actions" },
              { value: "user", label: "User Mutations" },
            ]}
          />
        </div>
      </Card>

      {/* Logs Timeline */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-xs text-brand-700/60">
                No audit entries match the current filter criteria.
              </div>
            ) : (
              filtered.map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-surfaceSubtle border border-slateSurface-200 rounded-xl hover:border-brand-300 transition-colors flex items-start gap-4 text-xs"
                >
                  <div className="p-2 rounded-xl bg-slateSurface-100 shrink-0 mt-0.5">
                    {log.actorType === "agent" ? (
                      <Bot className="w-4 h-4 text-forest-action" />
                    ) : (
                      <User className="w-4 h-4 text-blue-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-brand-900">{log.actorName}</span>
                        <Badge
                          variant={log.actorType === "agent" ? "lime" : "outline"}
                          size="sm"
                        >
                          {log.action}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-brand-700/50 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {log.timestamp}
                      </span>
                    </div>

                    <p className="text-brand-800 leading-relaxed">{log.details}</p>

                    <div className="text-[10px] text-brand-700/50 font-mono pt-1">
                      Target: {log.targetType} ({log.targetId})
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
