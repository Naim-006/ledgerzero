import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Master Admin Console – LEDGER ZERO",
  description: "Enterprise multi-tenant configuration, AI API keys, and system diagnostics",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-console-root min-h-dvh w-full bg-slate-950 text-slate-100 dark">
      {children}
    </div>
  );
}
