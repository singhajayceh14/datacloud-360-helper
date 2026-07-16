import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Data 360 App",
  description:
    "Design Salesforce Data Cloud 360 implementations end to end — sources, mappings, unification, segments, activation, entitlements, and the BRD/SDD.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full">
        <div className="grid h-screen grid-cols-[232px_1fr]">
          <Sidebar />
          <main className="overflow-auto px-8 py-7">{children}</main>
        </div>
      </body>
    </html>
  );
}
