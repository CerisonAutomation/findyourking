import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { LayoutClient } from "./layout-client";

const defaultUrl = process.env['VERCEL_URL']
  ? `https://${process.env['VERCEL_URL']}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Find Your King",
  description: "The fastest way to find your virtual king.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LayoutClient>{children}</LayoutClient>
        </ThemeProvider>
      </body>
    </html>
  );
}
