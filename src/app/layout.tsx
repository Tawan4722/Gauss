import type { Metadata } from "next"

import TopNav from "@/components/layout/TopNav"
import Footer from "@/components/layout/Footer"
import { LanguageProvider } from "@/lib/i18n"
import { ThemeProvider } from "@/lib/theme"
import "./globals.css"

export const metadata: Metadata = {
  title: "Gauss PDF - Every tool you need to work with PDFs in one place",
  description: "A 100% client-side local browser workspace to merge, split, compress, edit, convert, OCR, stamp, and protect PDF documents.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('gauss-theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-sky-500/20 selection:text-sky-600 dark:selection:text-sky-300 flex flex-col justify-between transition-colors duration-150">
        <ThemeProvider>
          <LanguageProvider>
            <div>
              <TopNav />
              {children}
            </div>
            <Footer />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

