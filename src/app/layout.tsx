import '../styles/globals.css'
import { createClient } from '@/lib/supabase-server'
import { SupabaseListener, SupabaseProvider } from '@/components/supabase-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { ErrorBoundary, NetworkErrorBoundary } from '@/components/error-boundary'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  const { data: { session } } = await supabase.auth.getSession()

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ff6b6b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FyKing Men" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="bg-[#0a0a0a] text-white">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <ErrorBoundary>
            <NetworkErrorBoundary>
              <SupabaseProvider session={session}>
                <SupabaseListener serverAccessToken={session?.access_token} />
                {children}
              </SupabaseProvider>
            </NetworkErrorBoundary>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}
