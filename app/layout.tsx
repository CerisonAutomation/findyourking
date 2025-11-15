import type { Metadata } from "next";
// import { Geist } from "next/font/google"; // Temporarily removed Geist font
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { Notifications } from "@/components/notifications";

const defaultUrl = process.env['VERCEL_URL']
  ? `https://${process.env['VERCEL_URL']}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Find Your King",
  description: "The fastest way to find your virtual king.",
};

// const geistSans = Geist({ // Temporarily removed Geist font
//   variable: "--font-geist-sans",
//   display: "swap",
//   subsets: ["latin"],
// });

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/globals.css" /> {/* Explicitly link global CSS as a robust fallback */}
      </head>
      <body className={`font-sans antialiased bg-background text-foreground`}> {/* Using a generic system font, with fallback background/text colors */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
            <div className="w-full max-w-4xl flex justify-between items-center p-3 text-sm">
              <a href="/">Home</a>
              {user && (
                <div className="flex items-center gap-4">
                  <a href="/account/profile">Profile</a>
                  <Notifications />
                  <form action="/auth/sign-out" method="post">
                    <button type="submit">Sign Out</button>
                  </form>
                </div>
              )}
              {!user && <a href="/auth/login">Login</a>}
            </div>
          </nav>
          <main className="min-h-[calc(100vh-4rem)] flex flex-col items-center">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
