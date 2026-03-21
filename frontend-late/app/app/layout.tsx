import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CTSE",
  description: "CTSE frontend",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
