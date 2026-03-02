import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Token-Sim Distribution Visualizer",
  description: "Visualize fair vs unfair bonding curve distributions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}

