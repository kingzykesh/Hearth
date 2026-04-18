import type { Metadata } from "next";
import "./globals.css";
import AppProvider from "./providers/app-provider";

export const metadata: Metadata = {
  title: "Hearth",
  description: "AI-enabled voice-based health risk screening platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}