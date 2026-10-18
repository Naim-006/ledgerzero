import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/app-context";

export const metadata: Metadata = {
  title: "LEDGER ZERO – Agentic AI Financial OS",
  description: "Autonomous financial intelligence & operating system for small businesses by NULL PROTOCOL. From financial insight to real-world action.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('ledger_zero_theme');
                  var isDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="h-full bg-background text-forest antialiased flex flex-col">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
