import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import LoadingScreen from "@/components/loading"
import { Suspense } from "react"
import Header from "@/components/header"
import { ScrollToTop } from "@/components/scroll-to-top"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FaceVault - Secure Face Recognition",
  description: "Secure and private face recognition system",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} h-full overflow-x-hidden`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LoadingScreen />
          <Suspense fallback={<LoadingScreen />}>
            <AuthProvider>
              <div className="min-h-screen bg-background text-foreground flex flex-col">
                <ScrollToTop />
                <Header />
                <main className="flex-grow container mx-auto px-0 sm:px-4 py-4 sm:py-6 md:py-8 max-w-[1920px]">
                  {children}
                </main>
                <Toaster />
              </div>
            </AuthProvider>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  )
}
